from datetime import datetime
from typing import Any

from backend.repositories.db import call_procedure


# Ejecuta las consultas de inventario directamente en los procedimientos.
def resumen() -> dict[str, Any]:
    return call_procedure("usp_Indicador_Resumen")[0]


def stock_bajo() -> list[dict[str, Any]]:
    return call_procedure("usp_Indicador_StockBajo")


def vencimientos() -> list[dict[str, Any]]:
    return call_procedure("usp_Indicador_Vencimientos")


# Cuenta las unidades retiradas usando el mismo rango UTC que el historial.
def mayores_salidas(
    desde_utc: datetime | None, hasta_utc: datetime | None
) -> list[dict[str, Any]]:
    return call_procedure("usp_Indicador_MayoresSalidas", [desde_utc, hasta_utc])
