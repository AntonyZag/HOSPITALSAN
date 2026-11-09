from datetime import date

from fastapi import APIRouter

from backend.schemas.indicador import (
    MayorSalidaResponse,
    ResumenInventarioResponse,
    StockBajoResponse,
    VencimientoResponse,
)
from backend.services import indicadores as service

router = APIRouter(prefix="/api/indicadores", tags=["indicadores"])


# Rutas para el resumen y las listas del inventario actual.
@router.get("/resumen")
def resumen() -> ResumenInventarioResponse:
    return service.resumen()


@router.get("/stock-bajo")
def stock_bajo() -> list[StockBajoResponse]:
    return service.stock_bajo()


@router.get("/vencimientos")
def vencimientos() -> list[VencimientoResponse]:
    return service.vencimientos()


# El ranking siempre se consulta con una fecha inicial y una final.
@router.get("/mayores-salidas")
def mayores_salidas(desde: date, hasta: date) -> list[MayorSalidaResponse]:
    return service.mayores_salidas(desde, hasta)
