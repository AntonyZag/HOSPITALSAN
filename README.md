# Hospital San Gabriel

Inventario hospitalario: Productos, Categorías, Entradas, Salidas, Historial e
Indicadores. Angular 22 usa Signal Forms y Bootstrap 5; FastAPI separa APIs,
Services, Repositories y Schemas. SQL Server conserva lotes y movimientos mediante
procedimientos almacenados y transacciones.

## Preparar otra computadora Windows

- Git y [uv](https://docs.astral.sh/uv/getting-started/installation/).
- Python 3.15 de 64 bits (`.python-version`). uv puede instalarlo con `uv python install 3.15`.
- Node.js compatible con Angular 22: `^22.22.3 || ^24.15.0 || >=26.0.0`.
  Se verificó con Node 24.15.0 y npm 11.12.1.
- SQL Server (por ejemplo Express), instancia en ejecución y cuenta SQL habilitada.
- [Microsoft ODBC Driver 17 x64](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server#version-17)
  y su requisito Microsoft Visual C++ si falta. SSMS permite ejecutar los SQL manualmente.

El controlador ODBC de Windows y el paquete Python `pyodbc` son distintos. El
proyecto fija **pyodbc 5.4.0** en `pyproject.toml` y `uv.lock`. Mantener activo el
Control inteligente de aplicaciones.

## 1. Backend y base local

Después de clonar, abrir PowerShell en **backend/**:

```powershell
uv sync --locked
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Editar **backend/.env** en esa computadora: `DB_SERVER` con el nombre real de la
instancia (por ejemplo `localhost\SQLEXPRESS`), `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
Mantener `DB_DRIVER=ODBC Driver 17 for SQL Server` si se instaló ese controlador.
No enviar las credenciales al chat ni subir `.env` a Git.

Desde la misma carpeta:

```powershell
uv run python verificar_entorno.py
uv run python ../database/preparar_bd.py --datos
uv run python verificar_entorno.py --db
uv run uvicorn backend.main:app
```

La preparación trabaja exclusivamente en **HospitalSanGabriel** y carga 12 productos
con códigos `MED`, `INS`, `LAB` y `LIM`, presentaciones y descripciones específicas.
Utiliza los mismos procedimientos que las pantallas de Productos, Entradas y Salidas.
Los precios son referenciales para la sustentación. Se ejecuta una vez por base;
repetirla no duplica existencias ni movimientos. Para preparar solo el esquema,
omitir `--datos`. Ver [datos iniciales](database/README.md).

Comprobar [Swagger](http://localhost:8000/docs) y
[conexión SQL](http://localhost:8000/api/test). `/docs` confirma el servidor;
`/api/test` también debe funcionar para confirmar SQL Server.

Si la cuenta habitual no puede crear bases/procedimientos, un administrador puede
prepararlos desde SSMS y conceder permisos. Ver [base de datos](database/README.md).

## 2. Frontend

Abrir otra terminal en **frontend/**, dejando el backend en ejecución:

```powershell
npm ci
npm start
```

Abrir [http://localhost:4200](http://localhost:4200), iniciar sesión y consultar
Productos o actualizar Indicadores. La API está configurada en
`frontend/src/environments/environment.ts` para `http://localhost:8000/api`.
No iniciar otra copia si los puertos 8000 o 4200 ya están ocupados.

El login actual es una **sesión de demostración validada en Angular**. No existe
autenticación ni autorización en FastAPI. No presentarlo como seguridad para
producción. Las credenciales de la demo se entregan por separado.

## Datos al clonar

Git comparte código y scripts, **no los registros de tu SQL Server local**. Otra
PC comienza con su propia base. Ejecutar la carga inicial en HospitalSanGabriel
hace que esos productos aparezcan en Angular al consultar nuevamente.
Para compartir exactamente registros reales habría que restaurar una copia de la
base o usar un servidor compartido; ese traslado no forma parte de esta demo.

## Verificación y entrega

Desde `frontend/`:

```powershell
npm run build
npm test -- --watch=false
```

Desde `backend/`, para revisar el entorno sin modificar datos:

```powershell
uv run python verificar_entorno.py --db
```

El diagnóstico consulta la configuración, conexión y procedimientos de la base del
proyecto. No crea bases adicionales, productos ni movimientos.

- [Preparación y solución de errores en la PC del ingeniero](docs/ENTREGA.md).
- [Revisión de requisitos y límites](docs/REQUISITOS.md).
- [Resultado de las verificaciones de cierre](docs/VERIFICACION_CIERRE.md).
- [Backend](backend/README.md), [frontend](frontend/README.md), [SQL y catálogo](database/README.md).

Los cambios de cierre quedan en `interfaz`. El responsable realiza el commit y el
PR a `main`; compartir `main` después de integrar y comprobar un clon de esa rama.
`.env`, `.venv`, `node_modules` e informes temporales no se suben al repositorio.

