from datetime import datetime

from fastapi import APIRouter, Query, status

from backend.schemas.entrada import EntradaCreate, EntradaResponse
from backend.services import entradas as service

router = APIRouter(prefix="/api/entradas", tags=["entradas"])


@router.get("", response_model=list[EntradaResponse])
def listar(
    id_producto: int | None = Query(default=None, gt=0),
    desde: datetime | None = Query(default=None),
    hasta: datetime | None = Query(default=None),
) -> list[EntradaResponse]:
    return service.listar(id_producto, desde, hasta)


@router.post("", response_model=EntradaResponse, status_code=status.HTTP_201_CREATED)
def registrar(payload: EntradaCreate) -> EntradaResponse:
    return service.registrar(
        id_producto=payload.id_producto,
        numero_lote=payload.numero_lote,
        fecha_vencimiento=payload.fecha_vencimiento,
        cantidad=payload.cantidad,
        motivo=payload.motivo,
    )
