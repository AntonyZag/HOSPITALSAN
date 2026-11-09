from datetime import date

from fastapi import APIRouter, Query

from backend.schemas.movimiento import MovimientoResponse, TipoMovimiento
from backend.services import historial as service

router = APIRouter(prefix="/api/historial", tags=["historial"])


# Recibe los filtros opcionales para consultar entradas y salidas.
@router.get("")
def listar(
    id_producto: int | None = Query(default=None, gt=0, le=2_147_483_647),
    tipo_movimiento: TipoMovimiento | None = None,
    id_area_destino: int | None = Query(default=None, gt=0, le=2_147_483_647),
    desde: date | None = None,
    hasta: date | None = None,
) -> list[MovimientoResponse]:
    return service.listar(id_producto, tipo_movimiento, id_area_destino, desde, hasta)
