from datetime import date, datetime, timezone

from backend.errors import BusinessRuleError
from backend.repositories import entradas as repository
from backend.schemas.entrada import EntradaResponse


def _normalizar_fecha(valor: datetime | None) -> datetime | None:
    if valor is None:
        return None
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc)


def registrar(
    id_producto: int,
    numero_lote: str,
    fecha_vencimiento: date,
    cantidad: int,
    motivo: str,
) -> EntradaResponse:
    return EntradaResponse.model_validate(
        repository.registrar(
            id_producto,
            numero_lote,
            fecha_vencimiento,
            cantidad,
            motivo,
        )
    )


def listar(
    id_producto: int | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
) -> list[EntradaResponse]:
    desde_normalizado = _normalizar_fecha(desde)
    hasta_normalizado = _normalizar_fecha(hasta)

    if (
        desde_normalizado is not None
        and hasta_normalizado is not None
        and desde_normalizado >= hasta_normalizado
    ):
        raise BusinessRuleError("La fecha inicial debe ser anterior a la fecha final.")

    rows = repository.listar(id_producto, desde, hasta)
    return [EntradaResponse.model_validate(row) for row in rows]
