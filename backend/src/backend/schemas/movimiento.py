from datetime import datetime, timezone
from typing import Literal

from pydantic import field_validator

from backend.schemas.base import BaseSchema

TipoMovimiento = Literal["ENTRADA", "SALIDA"]


# Usa el mismo formato para el historial y el comprobante de una salida.
class MovimientoResponse(BaseSchema):
    id_movimiento: int
    id_producto: int
    nombre_producto: str
    id_lote: int | None
    numero_lote: str | None
    tipo_movimiento: TipoMovimiento
    cantidad: int
    fecha_movimiento: datetime | None
    motivo: str
    id_area_destino: int | None
    nombre_area: str | None
    stock_anterior: int
    stock_posterior: int

    @field_validator("fecha_movimiento")
    @classmethod
    def indicar_utc(cls, fecha: datetime | None) -> datetime | None:
        # SQL Server guarda esta fecha en UTC, pero DATETIME2 no trae la zona.
        if fecha is not None and fecha.tzinfo is None:
            return fecha.replace(tzinfo=timezone.utc)
        return fecha
