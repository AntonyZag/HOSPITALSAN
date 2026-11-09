from fastapi import APIRouter, Query, status

from backend.schemas.producto import (
    LoteResponse,
    ProductoCreate,
    ProductoEstadoUpdate,
    ProductoResponse,
    ProductoUpdate,
    ProximoVencerResponse,
)
from backend.services import productos as service

router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.get("", response_model=list[ProductoResponse])
def listar(
    busqueda: str | None = Query(default=None, max_length=120),
    id_categoria: int | None = Query(default=None, gt=0),
    activo: bool | None = Query(default=None),
    solo_stock_bajo: bool = Query(default=False),
    dias_vencimiento: int | None = Query(default=None, ge=1),
) -> list[ProductoResponse]:
    return service.listar(
        busqueda=busqueda,
        id_categoria=id_categoria,
        activo=activo,
        solo_stock_bajo=solo_stock_bajo,
        dias_vencimiento=dias_vencimiento,
    )


@router.get("/proximos-vencer", response_model=list[ProximoVencerResponse])
def proximos_vencer(
    dias: int = Query(default=30, ge=1),
) -> list[ProximoVencerResponse]:
    return service.proximos_vencer(dias)


@router.get("/{id_producto}", response_model=ProductoResponse)
def obtener(id_producto: int) -> ProductoResponse:
    return service.obtener(id_producto)


@router.get("/{id_producto}/lotes", response_model=list[LoteResponse])
def listar_lotes(id_producto: int) -> list[LoteResponse]:
    return service.listar_lotes(id_producto)


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def registrar(payload: ProductoCreate) -> ProductoResponse:
    return service.registrar(
        codigo=payload.codigo,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        id_categoria=payload.id_categoria,
        unidad_medida=payload.unidad_medida,
        precio_unitario=payload.precio_unitario,
        stock_minimo=payload.stock_minimo,
    )


@router.put("/{id_producto}", response_model=ProductoResponse)
def actualizar(id_producto: int, payload: ProductoUpdate) -> ProductoResponse:
    return service.actualizar(
        id_producto=id_producto,
        codigo=payload.codigo,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        id_categoria=payload.id_categoria,
        unidad_medida=payload.unidad_medida,
        precio_unitario=payload.precio_unitario,
        stock_minimo=payload.stock_minimo,
    )


@router.patch("/{id_producto}/estado", response_model=ProductoResponse)
def cambiar_estado(
    id_producto: int,
    payload: ProductoEstadoUpdate,
) -> ProductoResponse:
    return service.cambiar_estado(id_producto, payload.activo)
