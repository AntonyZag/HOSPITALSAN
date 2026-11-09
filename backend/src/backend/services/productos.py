from decimal import Decimal

from backend.repositories import productos as repository
from backend.schemas.producto import (
    LoteResponse,
    ProductoResponse,
    ProximoVencerResponse,
)


def listar(
    busqueda: str | None = None,
    id_categoria: int | None = None,
    activo: bool | None = None,
    solo_stock_bajo: bool = False,
    dias_vencimiento: int | None = None,
) -> list[ProductoResponse]:
    rows = repository.listar(
        busqueda,
        id_categoria,
        activo,
        solo_stock_bajo,
        dias_vencimiento,
    )
    return [ProductoResponse.model_validate(row) for row in rows]


def obtener(id_producto: int) -> ProductoResponse:
    return ProductoResponse.model_validate(repository.obtener(id_producto))


def registrar(
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    unidad_medida: str,
    precio_unitario: Decimal,
    stock_minimo: int,
) -> ProductoResponse:
    return ProductoResponse.model_validate(
        repository.registrar(
            codigo,
            nombre,
            descripcion,
            id_categoria,
            unidad_medida,
            precio_unitario,
            stock_minimo,
        )
    )


def actualizar(
    id_producto: int,
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    unidad_medida: str,
    precio_unitario: Decimal,
    stock_minimo: int,
) -> ProductoResponse:
    return ProductoResponse.model_validate(
        repository.actualizar(
            id_producto,
            codigo,
            nombre,
            descripcion,
            id_categoria,
            unidad_medida,
            precio_unitario,
            stock_minimo,
        )
    )


def cambiar_estado(id_producto: int, activo: bool) -> ProductoResponse:
    return ProductoResponse.model_validate(repository.cambiar_estado(id_producto, activo))


def proximos_vencer(dias: int = 30) -> list[ProximoVencerResponse]:
    rows = repository.proximos_vencer(dias)
    return [ProximoVencerResponse.model_validate(row) for row in rows]


def listar_lotes(id_producto: int) -> list[LoteResponse]:
    rows = repository.listar_lotes(id_producto)
    return [LoteResponse.model_validate(row) for row in rows]
