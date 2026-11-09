from backend.repositories import salidas as repository
from backend.schemas.movimiento import MovimientoResponse
from backend.schemas.producto import LoteResponse
from backend.schemas.salida import AreaHospitalariaResponse, SalidaCreate


# Prepara las listas que llenan los selectores del formulario.
def listar_areas() -> list[AreaHospitalariaResponse]:
    return [AreaHospitalariaResponse.model_validate(row) for row in repository.listar_areas()]


def listar_lotes_vigentes(id_producto: int) -> list[LoteResponse]:
    return [
        LoteResponse.model_validate(row) for row in repository.listar_lotes_vigentes(id_producto)
    ]


# Pide el descuento y devuelve el movimiento que quedó registrado.
def registrar(payload: SalidaCreate) -> MovimientoResponse:
    movimiento = repository.registrar(
        payload.id_producto,
        payload.id_lote,
        payload.cantidad,
        payload.fecha,
        payload.motivo,
        payload.id_area_destino,
    )
    return MovimientoResponse.model_validate(movimiento)
