from decimal import Decimal
from typing import Any

from backend.repositories.db import call_procedure


def listar(
    busqueda: str | None,
    id_categoria: int | None,
    activo: bool | None,
    solo_stock_bajo: bool,
    dias_vencimiento: int | None,
) -> list[dict[str, Any]]:
    return call_procedure(
        "usp_Producto_Listar",
        [busqueda, id_categoria, activo, solo_stock_bajo, dias_vencimiento],
    )


def obtener(id_producto: int) -> dict[str, Any]:
    return call_procedure("usp_Producto_Obtener", [id_producto])[0]


def registrar(
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    unidad_medida: str,
    precio_unitario: Decimal,
    stock_minimo: int,
) -> dict[str, Any]:
    return call_procedure(
        "usp_Producto_Registrar",
        [
            codigo,
            nombre,
            descripcion,
            id_categoria,
            unidad_medida,
            precio_unitario,
            stock_minimo,
        ],
        commit=True,
    )[0]


def actualizar(
    id_producto: int,
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    unidad_medida: str,
    precio_unitario: Decimal,
    stock_minimo: int,
) -> dict[str, Any]:
    return call_procedure(
        "usp_Producto_Actualizar",
        [
            id_producto,
            codigo,
            nombre,
            descripcion,
            id_categoria,
            unidad_medida,
            precio_unitario,
            stock_minimo,
        ],
        commit=True,
    )[0]


def cambiar_estado(id_producto: int, activo: bool) -> dict[str, Any]:
    return call_procedure(
        "usp_Producto_CambiarEstado",
        [id_producto, activo],
        commit=True,
    )[0]


def proximos_vencer(dias: int = 30) -> list[dict[str, Any]]:
    return call_procedure("usp_Producto_ProximosVencer", [dias])


def listar_lotes(id_producto: int) -> list[dict[str, Any]]:
    return call_procedure("usp_Lote_ListarPorProducto", [id_producto])
