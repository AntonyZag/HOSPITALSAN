from backend.repositories import categorias as repository
from backend.schemas.categoria import CategoriaResponse


def listar(solo_activas: bool = False) -> list[CategoriaResponse]:
    return [CategoriaResponse.model_validate(row) for row in repository.listar(solo_activas)]


def registrar(nombre: str, descripcion: str | None) -> CategoriaResponse:
    return CategoriaResponse.model_validate(repository.registrar(nombre, descripcion))


def actualizar(
    id_categoria: int,
    nombre: str,
    descripcion: str | None,
) -> CategoriaResponse:
    return CategoriaResponse.model_validate(
        repository.actualizar(id_categoria, nombre, descripcion)
    )


def cambiar_estado(id_categoria: int, activo: bool) -> CategoriaResponse:
    return CategoriaResponse.model_validate(repository.cambiar_estado(id_categoria, activo))
