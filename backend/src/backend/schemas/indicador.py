from datetime import date
from decimal import Decimal
from typing import Literal

from backend.schemas.base import BaseSchema


# Mantiene el valor del inventario en decimal para conservar los centavos.
class ResumenInventarioResponse(BaseSchema):
    productos_activos: int
    valor_inventario: Decimal


# Define las filas de stock bajo, vencimientos y productos más retirados.
class StockBajoResponse(BaseSchema):
    id_producto: int
    codigo: str
    nombre_producto: str
    activo: bool
    stock_minimo: int
    stock_actual: int


class VencimientoResponse(BaseSchema):
    id_lote: int
    codigo: str
    nombre_producto: str
    numero_lote: str
    fecha_vencimiento: date
    cantidad_disponible: int
    estado: Literal["VENCIDO", "PROXIMO"]


class MayorSalidaResponse(BaseSchema):
    id_producto: int
    codigo: str
    nombre_producto: str
    unidades_retiradas: int
