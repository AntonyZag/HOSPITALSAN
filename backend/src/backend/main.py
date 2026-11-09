from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.apis.categorias import router as categorias_router
from backend.apis.connectivity import router as connectivity_router
from backend.apis.entradas import router as entradas_router
from backend.apis.historial import router as historial_router
from backend.apis.indicadores import router as indicadores_router
from backend.apis.productos import router as productos_router
from backend.apis.salidas import router as salidas_router
from backend.config import CORS_ORIGINS
from backend.errors import AppError

app = FastAPI(title="Hospital San Gabriel")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, error: AppError) -> JSONResponse:
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


app.include_router(connectivity_router)
app.include_router(categorias_router)
app.include_router(productos_router)
app.include_router(entradas_router)

# Conecta las rutas de salidas, historial e indicadores.
app.include_router(salidas_router)
app.include_router(historial_router)
app.include_router(indicadores_router)
