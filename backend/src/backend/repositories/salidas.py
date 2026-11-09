from datetime import date
from typing import Any

from backend.repositories.db import call_procedure


# Pide a SQL Server las áreas y los lotes que pueden aparecer en el formulario.
def listar_areas() -> list[dict[str, Any]]:
    return call_procedure("usp_AreaHospitalaria_Listar")


def listar_lotes_vigentes(id_producto: int) -> list[dict[str, Any]]:
    return call_procedure("usp_Salida_ListarLotesVigentes", [id_producto])


# Confirma en la conexión el descuento y su registro de historial.
def registrar(
    id_producto: int,
    id_lote: int,
    cantidad: int,
    fecha: date,
    motivo: str,
    id_area_destino: int,
) -> dict[str, Any]:
    return call_procedure(
        "usp_Salida_Registrar",
        [id_producto, id_lote, cantidad, fecha, motivo, id_area_destino],
        commit=True,
    )[0]
