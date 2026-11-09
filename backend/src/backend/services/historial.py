from datetime import date, datetime, time, timedelta

from backend.errors import BusinessRuleError
from backend.repositories import historial as repository
from backend.schemas.movimiento import MovimientoResponse, TipoMovimiento


# Un día en Lima empieza a las 05:00 UTC. Incluye el día final completo.
def limites_utc(
    desde: date | None, hasta: date | None
) -> tuple[datetime | None, datetime | None]:
    if desde is not None and hasta is not None and desde > hasta:
        raise BusinessRuleError("La fecha inicial debe ser igual o anterior a la fecha final.")

    desde_utc = datetime.combine(desde, time(5)) if desde is not None else None
    hasta_utc = None
    if hasta is not None and hasta < date.max:
        hasta_utc = datetime.combine(hasta + timedelta(days=1), time(5))
    return desde_utc, hasta_utc


# Valida el rango y arma las filas para la tabla de movimientos.
def listar(
    id_producto: int | None,
    tipo_movimiento: TipoMovimiento | None,
    id_area_destino: int | None,
    desde: date | None,
    hasta: date | None,
) -> list[MovimientoResponse]:
    desde_utc, hasta_utc = limites_utc(desde, hasta)
    rows = repository.listar(id_producto, tipo_movimiento, id_area_destino, desde_utc, hasta_utc)
    return [MovimientoResponse.model_validate(row) for row in rows]
