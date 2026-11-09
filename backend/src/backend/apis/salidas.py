from fastapi import APIRouter, Path, status

from backend.schemas.movimiento import MovimientoResponse
from backend.schemas.producto import LoteResponse
from backend.schemas.salida import AreaHospitalariaResponse, SalidaCreate
from backend.services import salidas as service

router = APIRouter(prefix="/api/salidas", tags=["salidas"])


# Ofrece los datos necesarios para elegir el destino y el lote.
@router.get("/areas")
def listar_areas() -> list[AreaHospitalariaResponse]:
    return service.listar_areas()


@router.get("/lotes-vigentes/{id_producto}")
def listar_lotes_vigentes(id_producto: int = Path(gt=0, le=2_147_483_647)) -> list[LoteResponse]:
    return service.listar_lotes_vigentes(id_producto)


# Recibe el formulario y responde con el comprobante de la salida.
@router.post("", status_code=status.HTTP_201_CREATED)
def registrar(payload: SalidaCreate) -> MovimientoResponse:
    return service.registrar(payload)
