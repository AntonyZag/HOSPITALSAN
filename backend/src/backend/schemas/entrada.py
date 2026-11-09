from datetime import date, datetime

from pydantic import Field

from backend.schemas.base import BaseSchema


class EntradaCreate(BaseSchema):
    id_producto: int = Field(gt=0)
    numero_lote: str = Field(min_length=1, max_length=50)
    fecha_vencimiento: date
    cantidad: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=50)


class EntradaResponse(BaseSchema):
    id_movimiento: int
    id_producto: int
    nombre_producto: str
    id_lote: int
    numero_lote: str
    tipo_movimiento: str
    cantidad: int
    fecha_movimiento: datetime
    motivo: str
    stock_anterior: int
    stock_posterior: int
