from fastapi import APIRouter, Query, status

from backend.schemas.categoria import (
    CategoriaCreate,
    CategoriaEstadoUpdate,
    CategoriaResponse,
    CategoriaUpdate,
)
from backend.services import categorias as service

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


@router.get("", response_model=list[CategoriaResponse])
def listar(solo_activas: bool = Query(default=False)) -> list[CategoriaResponse]:
    return service.listar(solo_activas)


@router.post("", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def registrar(payload: CategoriaCreate) -> CategoriaResponse:
    return service.registrar(payload.nombre, payload.descripcion)


@router.put("/{id_categoria}", response_model=CategoriaResponse)
def actualizar(id_categoria: int, payload: CategoriaUpdate) -> CategoriaResponse:
    return service.actualizar(id_categoria, payload.nombre, payload.descripcion)


@router.patch("/{id_categoria}/estado", response_model=CategoriaResponse)
def cambiar_estado(
    id_categoria: int,
    payload: CategoriaEstadoUpdate,
) -> CategoriaResponse:
    return service.cambiar_estado(id_categoria, payload.activo)
