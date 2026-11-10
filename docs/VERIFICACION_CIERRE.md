# Resultado de la verificación de cierre

Fecha: 10 de noviembre de 2026 (Lima). Rama: **interfaz**.
Punto de partida: `7344441`, que incluye el merge del PR #2 (`362c8de`).
Estos cambios todavía no tienen commit ni PR; `main` no se modificó.

## Corrección solicitada por el responsable

Se eliminaron las dos bases QA creadas anteriormente y el script que las generaba.
También se eliminó `tmp/clon_entrega`. La carga actual es
`database/datos_iniciales.sql`, exclusiva de HospitalSanGabriel.

Se actualizaron las 12 fichas mediante `usp_Producto_Actualizar`, con códigos
MED/INS/LAB/LIM, nombres y descripciones de presentación específicos. Se verificó
que los dos productos originales y todos los lotes y movimientos quedaron idénticos.
Una segunda ejecución conservó productos, stock e historial sin duplicados.
FastAPI devolvió las 12 fichas corregidas. Los precios son referenciales.

Lo que sigue registra las comprobaciones anteriores, realizadas antes de esta
corrección; sus nombres DEMO ya no corresponden al catálogo actual.

## Instalación sin dependencias del proyecto original

Se creó un clon local de `interfaz` en `tmp/clon_entrega` y se aplicaron los archivos
de cierre del directorio de trabajo. El clon comenzó sin `.venv` ni `node_modules`.
Es una comprobación local de los cambios preparados, no un clon de un `main` ya integrado.
Se utilizaron las cachés disponibles en esta computadora; no equivale a probar
otra PC, una instalación sin Internet o una política distinta de Windows.

| Comprobación | Resultado observado |
| --- | --- |
| `uv sync --locked` en clon/backend | Entorno nuevo: Python 3.15.2 x64 y pyodbc 5.4.0, resto de paquetes del lock |
| `uv run uvicorn backend.main:app --port 8011` desde clon/backend | Arranque correcto con el comando corto y puerto temporal libre |
| `/docs` y `/api/test` del clon | HTTP 200 y conexión SQL exitosa |
| `npm ci --no-audit --no-fund` en clon/frontend | 313 paquetes instalados desde package-lock.json |
| `npm run build` en clon/frontend | Compilación de producción correcta |
| `npm test -- --watch=false` en clon/frontend | 7 archivos y **12 tests aprobados** |
| Diagnóstico `verificar_entorno.py --db` | Versiones, importaciones, configuración, ODBC y procedimientos correctos |

Las restricciones del entorno aislado de la herramienta impidieron inicialmente
el acceso a cachés/archivos temporales de uv, npm y Vitest; se repitieron esas
operaciones con permisos de ejecución aprobados. No se cambió la protección de Windows.
La copia temporal privada de `.env` se eliminó después de comprobar el clon.
Se cerró el servidor temporal del puerto 8011. Los servidores habituales no se detuvieron.

## SQL y API

`verificar_demo.py` aprobó **38 comprobaciones** en una base QA independiente,
incluyendo repetir esquema/demo sin alterar productos, lotes ni historial.
Probó operaciones válidas y rechazadas por saldo, vencimiento, cantidades, fecha,
estado, código duplicado y precio cero. Las bases QA utilizadas ya fueron eliminadas
a petición del responsable; el archivo de auditoría también fue retirado.

Después se ejecutó la preparación con demo en la base local habitual:

- **12 productos DEMO**, 12 entradas y 9 salidas ficticias.
- **2 productos anteriores conservados**: 14 productos totales, 13 activos.
- Búsqueda `DEMO-` y categoría Medicamentos: 3 coincidencias correctas.
- `/docs`, `/api/test`, Historial e indicadores respondieron correctamente.
- Angular respondió en `http://localhost:4200`.

## Navegador

Se inició sesión en la aplicación existente, se observaron los indicadores
actualizados y sus alertas, se filtraron los **12 productos DEMO** incluyendo
el inactivo, y luego se filtró Medicamentos. Historial mostró las entradas y
salidas con lote, área y saldos. No se registraron movimientos de prueba nuevos
en la base habitual desde el navegador.

Las capturas locales están en `tmp/productos-demo.png` y
`tmp/filtro-demo-medicamentos.png`, fuera del control de versiones.

## Pendiente para la entrega final

Revisar [REQUISITOS.md](REQUISITOS.md): RF03 usa fecha automática y el acceso es
una demo frontend. El responsable debe realizar commit/PR, integrar a `main` y
repetir el arranque desde esa rama antes de compartir su enlace al docente.
