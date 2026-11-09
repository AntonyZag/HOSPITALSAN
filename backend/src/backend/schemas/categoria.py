from pydantic import Field

from backend.schemas.base import BaseSchema


class CategoriaCreate(BaseSchema):
    nombre: str = Field(min_length=1, max_length=80)
    descripcion: str | None = Field(default=None, max_length=250)


class CategoriaUpdate(BaseSchema):
    nombre: str = Field(min_length=1, max_length=80)
    descripcion: str | None = Field(default=None, max_length=250)


class CategoriaEstadoUpdate(BaseSchema):
    activo: bool


class CategoriaResponse(BaseSchema):
    id_categoria: int
    nombre: str
    descripcion: str | None
    activo: bool
    cantidad_productos: int
