from datetime import date
from decimal import Decimal

from pydantic import Field

from backend.schemas.base import BaseSchema


class ProductoCreate(BaseSchema):
    codigo: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=120)
    descripcion: str | None = Field(default=None, max_length=500)
    id_categoria: int = Field(gt=0)
    unidad_medida: str = Field(min_length=1, max_length=20)
    precio_unitario: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock_minimo: int = Field(gt=0)


class ProductoUpdate(BaseSchema):
    codigo: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=120)
    descripcion: str | None = Field(default=None, max_length=500)
    id_categoria: int = Field(gt=0)
    unidad_medida: str = Field(min_length=1, max_length=20)
    precio_unitario: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock_minimo: int = Field(gt=0)


class ProductoEstadoUpdate(BaseSchema):
    activo: bool


class ProductoResponse(BaseSchema):
    id_producto: int
    codigo: str
    nombre: str
    descripcion: str | None
    id_categoria: int
    nombre_categoria: str
    unidad_medida: str
    precio_unitario: Decimal
    stock_minimo: int
    activo: bool
    stock_actual: int
    proximo_vencimiento: date | None


class ProximoVencerResponse(BaseSchema):
    id_producto: int
    codigo: str
    nombre: str
    activo: bool
    id_lote: int
    numero_lote: str
    fecha_vencimiento: date
    cantidad_disponible: int
    dias_restantes: int


class LoteResponse(BaseSchema):
    id_lote: int
    id_producto: int
    numero_lote: str
    fecha_vencimiento: date
    cantidad_disponible: int
