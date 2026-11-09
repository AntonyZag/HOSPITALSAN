from datetime import datetime
from typing import Any

from backend.repositories.db import call_procedure


# Envía los filtros al procedimiento, incluidos los límites ya convertidos a UTC.
def listar(
    id_producto: int | None,
    tipo_movimiento: str | None,
    id_area_destino: int | None,
    desde_utc: datetime | None,
    hasta_utc: datetime | None,
) -> list[dict[str, Any]]:
    return call_procedure(
        "usp_Historial_Listar",
        [id_producto, tipo_movimiento, id_area_destino, desde_utc, hasta_utc],
    )
