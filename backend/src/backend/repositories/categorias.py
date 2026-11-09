from typing import Any

from backend.repositories.db import call_procedure


def listar(solo_activas: bool = False) -> list[dict[str, Any]]:
    return call_procedure("usp_Categoria_Listar", [solo_activas])


def registrar(nombre: str, descripcion: str | None) -> dict[str, Any]:
    return call_procedure(
        "usp_Categoria_Registrar",
        [nombre, descripcion],
        commit=True,
    )[0]


def actualizar(
    id_categoria: int,
    nombre: str,
    descripcion: str | None,
) -> dict[str, Any]:
    return call_procedure(
        "usp_Categoria_Actualizar",
        [id_categoria, nombre, descripcion],
        commit=True,
    )[0]


def cambiar_estado(id_categoria: int, activo: bool) -> dict[str, Any]:
    return call_procedure(
        "usp_Categoria_CambiarEstado",
        [id_categoria, activo],
        commit=True,
    )[0]
