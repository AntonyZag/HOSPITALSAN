from datetime import date, datetime, timezone
from typing import Any

from backend.repositories.db import call_procedure


def _to_utc_naive(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _normalize_fecha_movimiento(row: dict[str, Any]) -> dict[str, Any]:
    fecha = row.get("fecha_movimiento")
    if isinstance(fecha, datetime) and fecha.tzinfo is None:
        row["fecha_movimiento"] = fecha.replace(tzinfo=timezone.utc)
    return row


def registrar(
    id_producto: int,
    numero_lote: str,
    fecha_vencimiento: date,
    cantidad: int,
    motivo: str,
) -> dict[str, Any]:
    row = call_procedure(
        "usp_Entrada_Registrar",
        [id_producto, numero_lote, fecha_vencimiento, cantidad, motivo],
        commit=True,
    )[0]
    return _normalize_fecha_movimiento(row)


def listar(
    id_producto: int | None,
    desde: datetime | None,
    hasta: datetime | None,
) -> list[dict[str, Any]]:
    rows = call_procedure(
        "usp_Entrada_Listar",
        [id_producto, _to_utc_naive(desde), _to_utc_naive(hasta)],
    )
    return [_normalize_fecha_movimiento(row) for row in rows]
