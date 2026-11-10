# Base de datos y catálogo inicial de 12 productos

**script_completo_bd.sql** prepara la base, tablas, índices, cuatro categorías,
cuatro áreas y los 21 procedimientos RF01–RF06. Conserva tablas y registros existentes.
No es un sistema general de migraciones para esquemas modificados manualmente.

## Preparar con uv

Configurar `backend/.env`. Desde **backend/**:

```powershell
uv sync --locked
uv run python ../database/preparar_bd.py --datos
uv run python verificar_entorno.py --db
```

El preparador requiere `DB_NAME=HospitalSanGabriel`, abre inicialmente `master` y
selecciona exclusivamente la base del proyecto. No crea bases de prueba.
La cuenta necesita permisos para crear la base y sus objetos; con cuenta limitada,
pedir a un administrador que prepare desde SSMS. Sin `--datos` solo prepara el esquema.

## Alternativa en SSMS

1. Conectar a la instancia utilizada por el backend.
2. Ejecutar **script_completo_bd.sql**, que selecciona `HospitalSanGabriel`.
3. En otra consulta, seleccionar **esa misma base** en la lista de SSMS.
4. Ejecutar completo **datos_iniciales.sql**, que selecciona `HospitalSanGabriel`.
5. Confirmar que `DB_NAME` y `DB_SERVER` en `.env` apuntan a esa base e instancia.
6. Volver a consultar Productos/Historial o actualizar Indicadores desde Angular.

No hace falta registrar los productos uno por uno ni modificar el frontend.

## Contenido del catálogo

| Códigos | Categoría | Casos |
| --- | --- | --- |
| MED-001–003 | Medicamentos | Paracetamol 500 mg, amoxicilina 500 mg y cloruro de sodio 0.9% de 500 ml |
| INS-001–003 | Material médico | Guantes estériles talla 7, mascarillas de tres capas y gasas de 10 x 10 cm |
| LAB-001–003 | Laboratorio | Tubos EDTA K2 de 4 ml, reactivo de glucosa y frascos para orina de 100 ml |
| LIM-001–003 | Limpieza hospitalaria | Alcohol 70%, desinfectante y detergente enzimático de 1 litro |

Cada ficha tiene una descripción de su presentación y unidad de inventario.
Los precios y cantidades son referenciales; no representan compras verificadas.

**Base nueva:** registra 12 productos, 12 entradas y 9 salidas por los procedimientos
existentes. Quedan 11 activos y uno inactivo. Incluye stock normal, bajo, igual al
mínimo y agotado, además de próximos vencimientos. Las entradas usan la fecha real
del servidor y las salidas la fecha actual de Lima. Todos los lotes nuevos están
vigentes: registrar uno ya vencido sería rechazado por el formulario. No se
insertan ni actualizan directamente Lotes o HistorialMovimientos.

**Base que ya tenía la carga anterior:** identifica exclusivamente las 12 fichas
genéricas por su código, nombre y descripción anteriores y las edita mediante
`usp_Producto_Actualizar`. Conserva sus ID, estado, lotes, stock y movimientos,
incluidos sus identificadores históricos de lote. No toca los productos propios.
No borra historial ni lo reescribe para simular otras fechas o motivos.

**Repetición:** si el código y nombre del catálogo ya existen, los conserva; no
registra más entradas ni salidas y no repone stock consumido. Si detecta un código
ocupado por otro producto, cancela la transacción. No ejecutar en cada arranque.
Requiere las cuatro categorías activas y las áreas hospitalarias del esquema.

Las operaciones son las mismas que usa el frontend:
`usp_Producto_Registrar`, `usp_Producto_Actualizar`, `usp_Entrada_Registrar`,
`usp_Salida_Registrar` y `usp_Producto_CambiarEstado`. El script SQL ejecuta esos
procedimientos directamente; no simula solicitudes HTTP ni evita sus reglas de stock.

El stock se calcula con `SUM(Lotes.CantidadDisponible)`; no se guarda en Productos.
Las entradas ordinarias se registran en UTC; las fechas de salidas y filtros se
convierten desde el calendario de Lima según la implementación existente.

## Comprobación

Desde `backend/`: `uv run python verificar_entorno.py --db`. Después recargar
Productos, Historial e Indicadores. Para filtrar medicamentos buscar `MED-`.
No se crean bases QA ni clones del repositorio. Las dos bases de pruebas anteriores
y el script que las generaba fueron eliminados a petición del responsable.

`stored_procedures/` y `apply_stored_procedures.py` son la instalación anterior
RF01–RF03. Para esta entrega usar **el esquema unificado**.

Git no contiene registros SQL: cada computadora debe preparar su base. Esta carga
reproduce ejemplos sin compartir credenciales ni copias de datos personales.

