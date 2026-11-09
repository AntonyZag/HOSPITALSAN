from datetime import date

from pydantic import Field

from backend.schemas.base import BaseSchema


# Valida los datos que se necesitan para retirar unidades de un solo lote.
class SalidaCreate(BaseSchema):
    id_producto: int = Field(strict=True, gt=0, le=2_147_483_647)
    id_lote: int = Field(strict=True, gt=0, le=2_147_483_647)
    cantidad: int = Field(strict=True, gt=0, le=2_147_483_647)
    fecha: date
    motivo: str = Field(min_length=1, max_length=50)
    id_area_destino: int = Field(strict=True, gt=0, le=2_147_483_647)


# Da el identificador y el nombre que necesita el selector de áreas.
class AreaHospitalariaResponse(BaseSchema):
    id_area: int
    nombre_area: str
