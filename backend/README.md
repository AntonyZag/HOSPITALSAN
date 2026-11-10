# Backend — Hospital San Gabriel

FastAPI + Python 3.15 + uv + SQL Server. Desde **backend/**:

```powershell
uv sync --locked
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Completar las variables SQL en `.env` con los datos de esa computadora. La
configuración carga ese archivo y las variables del sistema pueden sobrescribirlo.
Nunca publicar credenciales. Se utiliza autenticación SQL con usuario y contraseña.

```powershell
uv run python verificar_entorno.py
uv run python ../database/preparar_bd.py --datos
uv run python verificar_entorno.py --db
uv run uvicorn backend.main:app
```

La preparación requiere permisos de creación de base/procedimientos. También
puede realizarla un administrador en SSMS. Trabaja solo en HospitalSanGabriel.
Omitir `--datos` para preparar solo el esquema.
Visitar `http://localhost:8000/docs` y `http://localhost:8000/api/test`.
El segundo devuelve 503 si SQL Server no es accesible. Tiempo de conexión: 5 segundos.
Para desarrollo se puede agregar `--reload`. `uv run backend` es un stub y no inicia la API.

## Arquitectura

- `src/backend/apis/`: rutas `/api` y respuestas HTTP.
- `services/`: validaciones y coordinación.
- `repositories/`: conexiones pyodbc y llamadas a procedimientos almacenados.
- `schemas/`: contratos Pydantic.
- `main.py`: errores comunes y CORS para GET, POST, PUT y PATCH.

`CORS_ORIGINS` debe incluir `http://localhost:4200`. No existe autenticación de API;
el login actual pertenece a la demo del frontend.

## Diagnóstico y pruebas

`verificar_entorno.py` solo lee información: Python, arquitectura, dependencias
frente a `uv.lock`, importación de binarios, configuración, controlador ODBC y puertos.
`--db` agrega conexión y presencia de procedimientos. No imprime valores del `.env`.
Un puerto ocupado se informa sin marcar fallo porque puede ser el servidor ya iniciado.

No hay configuración adicional de pytest, lint o typecheck. El script que creaba
bases QA se retiró; las comprobaciones indicadas aquí son de solo lectura.

Ver [guía de otra PC y errores de Windows](../docs/ENTREGA.md). Mantener
**pyodbc 5.4.0** y el Control inteligente de aplicaciones activo.
