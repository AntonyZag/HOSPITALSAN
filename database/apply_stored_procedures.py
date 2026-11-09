"""Aplica los scripts de procedimientos almacenados a SQL Server.

Uso recomendado desde la raíz del repositorio:
    backend/.venv/Scripts/python.exe database/apply_stored_procedures.py

También se puede ejecutar con uv desde backend:
    uv run python ../database/apply_stored_procedures.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend" / "src"))

from backend.repositories.db import get_connection  # noqa: E402

SQL_DIR = Path(__file__).resolve().parent / "stored_procedures"


def split_batches(script: str) -> list[str]:
    batches: list[str] = []
    current: list[str] = []

    for line in script.splitlines():
        if re.match(r"^\s*GO\s*$", line, re.IGNORECASE):
            batch = "\n".join(current).strip()
            if batch:
                batches.append(batch)
            current = []
        else:
            current.append(line)

    batch = "\n".join(current).strip()
    if batch:
        batches.append(batch)

    return batches


def main() -> int:
    files = sorted(SQL_DIR.glob("*.sql"))
    if not files:
        print(f"No se encontraron scripts SQL en {SQL_DIR}")
        return 1

    try:
        connection = get_connection()
    except ValueError as error:
        print(f"No se pudo conectar: {error}")
        print("Configura backend/.env con DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD y DB_DRIVER.")
        return 2
    except Exception as error:  # pyodbc.Error no se importa aquí para no acoplar el script
        print(f"No se pudo conectar a SQL Server: {error}")
        return 2

    try:
        connection.autocommit = True
        with connection.cursor() as cursor:
            for file in files:
                print(f"Aplicando {file.name}...")
                for batch in split_batches(file.read_text(encoding="utf-8-sig")):
                    cursor.execute(batch)
                print(f"  OK: {file.name}")
    except Exception as error:
        print(f"Error aplicando los scripts: {error}")
        return 3
    finally:
        connection.close()

    print("Procedimientos almacenados aplicados correctamente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
