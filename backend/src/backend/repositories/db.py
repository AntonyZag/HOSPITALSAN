from contextlib import closing
from logging import getLogger
import re
from typing import Any, Sequence

import pyodbc

from backend.config import settings
from backend.errors import (
    BusinessRuleError,
    ConflictError,
    DatabaseError,
    DatabaseUnavailableError,
    NotFoundError,
)

logger = getLogger(__name__)

_DOMAIN_ERRORS = {
    "50001": NotFoundError,
    "50002": ConflictError,
    "50003": BusinessRuleError,
}

_CONNECTION_SQLSTATES = {"08001", "08S01", "28000", "HYT00"}


def get_connection() -> pyodbc.Connection:
    connection_settings = {
        "DRIVER": settings.get("DB_DRIVER"),
        "SERVER": settings.get("DB_SERVER"),
        "DATABASE": settings.get("DB_NAME"),
        "UID": settings.get("DB_USER"),
        "PWD": settings.get("DB_PASSWORD"),
    }
    attributes = []
    for key, value in connection_settings.items():
        if not value:
            raise ValueError("La configuración de SQL Server está incompleta.")
        escaped_value = value.replace("}", "}}")
        attributes.append(f"{key}={{{escaped_value}}}")

    return pyodbc.connect(";".join(attributes), timeout=5)


def _clean_message(message: str) -> str:
    text = message.rsplit("]", 1)[-1].strip()
    text = re.sub(r"\s*\(\d{5}\)", "", text)
    text = re.sub(r"\s*\(SQLExecDirectW\)\s*$", "", text)
    return text.strip() or message


def _error_number(message: str) -> str | None:
    matches = re.findall(r"\((\d{5})\)", message)
    return matches[-1] if matches else None


def _raise_domain_error(error: pyodbc.Error) -> None:
    sqlstate = str(error.args[0]) if error.args else ""
    message = str(error.args[1]) if len(error.args) > 1 else str(error)
    clean_message = _clean_message(message)

    error_number = _error_number(message)
    error_type = _DOMAIN_ERRORS.get(error_number or "") or _DOMAIN_ERRORS.get(sqlstate)
    if error_type is not None:
        raise error_type(clean_message) from error

    lowered = message.lower()
    if (
        sqlstate == "23000"
        or error_number in {"2601", "2627"}
        or "duplicate" in lowered
        or "duplicad" in lowered
    ):
        raise ConflictError("Ya existe un registro con esos datos.") from error

    if sqlstate in _CONNECTION_SQLSTATES or "unable to connect" in lowered or "login failed" in lowered:
        raise DatabaseUnavailableError("No se pudo conectar a SQL Server.") from error

    logger.exception("Error de base de datos no controlado (SQLSTATE %s).", sqlstate)
    raise DatabaseError("Ocurrió un error en la base de datos.") from error


def call_procedure(
    name: str,
    params: Sequence[Any] = (),
    *,
    commit: bool = False,
) -> list[dict[str, Any]]:
    """Invoca un procedimiento almacenado y devuelve su primer result set."""

    try:
        with closing(get_connection()) as connection:
            with connection.cursor() as cursor:
                placeholders = ", ".join("?" for _ in params)
                cursor.execute(f"{{CALL dbo.{name} ({placeholders})}}", list(params))

                rows: list[dict[str, Any]] = []
                if cursor.description is not None:
                    columns = [column[0] for column in cursor.description]
                    rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

                if commit:
                    connection.commit()

                return rows
    except pyodbc.Error as error:
        _raise_domain_error(error)
        raise  # pragma: no cover - _raise_domain_error siempre lanza
    except ValueError as error:
        raise DatabaseUnavailableError(str(error)) from error
