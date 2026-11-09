from datetime import date

from backend.repositories import indicadores as repository
from backend.schemas.indicador import (
    MayorSalidaResponse,
    ResumenInventarioResponse,
    StockBajoResponse,
    VencimientoResponse,
)
from backend.services.historial import limites_utc


# Da a cada consulta el formato que espera el panel.
def resumen() -> ResumenInventarioResponse:
    return ResumenInventarioResponse.model_validate(repository.resumen())


def stock_bajo() -> list[StockBajoResponse]:
    return [StockBajoResponse.model_validate(row) for row in repository.stock_bajo()]


def vencimientos() -> list[VencimientoResponse]:
    return [VencimientoResponse.model_validate(row) for row in repository.vencimientos()]


# Aplica al ranking las mismas reglas de fechas que usa el historial.
def mayores_salidas(desde: date, hasta: date) -> list[MayorSalidaResponse]:
    rows = repository.mayores_salidas(*limites_utc(desde, hasta))
    return [MayorSalidaResponse.model_validate(row) for row in rows]
