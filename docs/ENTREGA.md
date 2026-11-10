# Preparar la sustentación en otra computadora

## Antes del día de la presentación

La mejor prevención es probar **en la computadora del ingeniero con anticipación**.
Un `uv.lock` reproduce paquetes Python; no instala SQL Server ni garantiza que
otra política de seguridad permita ejecutar todos sus binarios.

1. Tener Git, uv, Python 3.15 x64 y Node 24.15.0 o una versión compatible con Angular.
2. Tener SQL Server funcionando y conocer el nombre exacto de su instancia.
   Confirmar en SSMS que la cuenta SQL puede conectarse. El servidor debe permitir
   autenticación SQL; no hace falta usar `sa`.
3. Tener Microsoft ODBC Driver 17 x64 y su requisito Visual C++ instalado.
   No confundirlo con `pyodbc==5.4.0`, instalado por uv dentro del proyecto.
4. Configurar `backend/.env` en privado. Un administrador prepara la base;
   la cuenta habitual necesita acceso y ejecución de procedimientos del proyecto.
5. Seguir el README, incluyendo el catálogo inicial. Probar `/docs`, `/api/test`, Productos,
   Historial e Indicadores antes de la sustentación.
6. Tener instaladores oficiales e Internet para preparar dependencias antes del
   día de la entrega. Guardar el repositorio y scripts en una memoria de respaldo.
   Llevar la laptop propia ya comprobada como alternativa de presentación.

No copiar `.venv` ni `node_modules` entre computadoras. Recrearlos con
`uv sync --locked` y `npm ci`. No cambiar versiones ni usar `uv run --with` durante
la presentación. No desactivar el Control inteligente de aplicaciones.

## Secuencia corta de comprobación

En `backend/`, después de completar el `.env` y preparar la base:

```powershell
uv sync --locked
uv run python verificar_entorno.py --db
uv run uvicorn backend.main:app
```

En otra terminal, desde `frontend/`:

```powershell
npm ci
npm start
```

Abrir `/docs`, `/api/test` y `http://localhost:4200`. Un `/docs` correcto por sí
solo no garantiza conexión SQL ni procedimientos completos. El diagnóstico
`--db` distingue esas comprobaciones sin mostrar contraseñas.

## Si no arranca, leer el error antes de cambiar algo

| Mensaje o síntoma | Qué revisar y hacer |
| --- | --- |
| `uv` o `node` no reconocido | Instalar la herramienta oficial y abrir una terminal nueva |
| Python incorrecto o paquetes faltantes | Desde backend: `uv sync --locked` y repetir diagnóstico |
| Windows bloquea `pyodbc...pyd` | Verificar que se importa pyodbc 5.4.0; si sigue bloqueado, revisar el evento con el administrador. Cambiar el comando Uvicorn no arregla ese bloqueo |
| Windows bloquea `uvicorn.exe` y pyodbc sí importa | Probar `uv run --locked python -m uvicorn backend.main:app`; usa el mismo entorno y evita solo el lanzador |
| `IM002` / controlador no encontrado | Instalar ODBC Driver 17 x64 y hacer coincidir DB_DRIVER con el instalado |
| Error de DLL al cargar el controlador | Revisar instalación oficial ODBC y Visual C++ x64 |
| `08001`, `HYT00` o SQL inaccesible | Probar la misma instancia en SSMS, revisar servicio y DB_SERVER; revisar red si el servidor es remoto |
| `28000` / acceso SQL fallido | Revisar cuenta, contraseña, autenticación SQL y permisos en SSMS; corregir `.env` y reiniciar backend |
| `/api/test` funciona pero faltan procedimientos | Preparar el esquema unificado en la base correcta y repetir diagnóstico `--db` |
| `WinError 10048` / `Port 4200 is already in use` | Abrir la aplicación existente o detener su servidor en su propia terminal; no iniciar otra copia |
| API funciona, Angular no recibe datos | Revisar puerto 8000, environment.ts, CORS_ORIGINS y `/api/test`; reiniciar backend tras cambiar `.env` |
| Listados vacíos después de clonar | Ejecutar `preparar_bd.py --datos` o los SQL en SSMS y consultar nuevamente |

No se puede prometer que un binario aceptado en una PC será aceptado en todas.
Si Windows sigue bloqueándolo, conservar el mensaje y evento para el administrador;
usar la PC de respaldo para no consumir el tiempo de la sustentación.

## Antes de compartir main

- Revisar el diff, realizar commit en `interfaz` y abrir su PR a `main`.
- Confirmar que `main` contiene pyodbc 5.4.0, el lock, el esquema unificado, el catálogo
  de 12 productos y los README actualizados.
- El responsable puede comprobar `main` en la computadora de entrega siguiendo la guía.
- No incluir `.env`, contraseñas, bases reales ni carpetas de dependencias.
- Aclarar que el login es una demo local y revisar la observación de RF03 en
  [REQUISITOS.md](REQUISITOS.md) antes de afirmar cumplimiento completo.

## Fuentes oficiales

- [uv: sincronización y lock](https://docs.astral.sh/uv/concepts/projects/sync/).
- [Microsoft: controlador ODBC y requisitos](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server).
- [Microsoft: Control inteligente de aplicaciones](https://support.microsoft.com/en-us/windows/security/threat-malware-protection/smart-app-control-frequently-asked-questions).
