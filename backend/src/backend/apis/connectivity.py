from fastapi import APIRouter, HTTPException, status

from backend.schemas.connectivity import ConnectionStatus
from backend.services.connectivity import database_is_available

router = APIRouter(prefix="/api")


@router.get("/test", response_model=ConnectionStatus)
def test_connection() -> ConnectionStatus:
    if not database_is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo conectar a SQL Server.",
        )

    return ConnectionStatus(success=True, message="Conexión a SQL Server exitosa.")
