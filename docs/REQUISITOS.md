# Revisión de requisitos para la entrega

Referencia: **Unidad 3 (1).pdf**, páginas 2–7 y rúbrica 9–10. No se incluye el PDF
personal dentro del repositorio. Esta revisión distingue comprobaciones automáticas
y puntos por revisar con el docente.

| Requisito | Evidencia y estado |
| --- | --- |
| RF01 Productos | Catálogo, búsqueda, categoría, edición, estado lógico y vencimientos por lote. API rechaza código duplicado y precio cero; desactivar conserva historial |
| RF02 Categorías | Formularios, listado y asociación dinámica. Consulta y bloqueo de desactivación con productos comprobados por API |
| RF03 Entradas | Producto, cantidad, motivo, lote y vencimiento; stock e historial transaccionales. **Observación:** la fecha es automática del servidor; falta poder indicarla como menciona el PDF |
| RF04 Salidas | Producto, lote, cantidad, fecha, motivo y área. Probados retiro válido, saldo insuficiente, vencimiento, cantidades inválidas y fecha futura |
| RF05 Historial | Filtros de producto, tipo, área y fechas; lote y stocks anterior/posterior. Consulta y presencia de nuevos movimientos comprobadas |
| RF06 Indicadores | Activos, valor, stock bajo, vencidos/próximos, periodo y ranking. Endpoints responden desde SQL; demo incluye alertas |
| Angular 22 y Signal Forms | Componentes, servicios HTTP, formularios y Bootstrap responsive. Ejecutar build y tests; esto no equivale a probar toda interacción visual |
| Inicio de sesión | **Demo frontend** con sesión local y guardas. FastAPI no autentica/autoriza solicitudes; confirmar alcance esperado con el docente |
| FastAPI por capas | APIs → Services → Repositories y Schemas; errores HTTP. Repositorios invocan procedimientos |
| SQL Server y consistencia | Claves, relaciones, restricciones y procedimientos transaccionales. Auditoría comprueba rechazo sin alterar stock/historial y operaciones válidas con comprobante |
| Credenciales | `.env.example` sin claves y `.env` ignorado. No incluir credenciales SQL en commits, capturas ni reportes |
| Git, PR y README | PR previos y rama `interfaz`; guía de arranque y demo. **Pendiente del responsable:** commit/PR de cierre y comprobar `main` integrado |

## Comprobaciones

Desde `backend/`: `uv run python verificar_entorno.py --db`. Este diagnóstico es
de solo lectura sobre HospitalSanGabriel. El script que creaba bases QA se retiró.
La carga inicial usa los procedimientos del sistema y no altera directamente stock
ni historial. Su segunda ejecución debe conservar productos y movimientos.
El informe de cierre distingue las pruebas anteriores de las correcciones actuales.

## Recorrido para la sustentación

1. Iniciar sesión y mostrar resumen y alertas.
2. Buscar `MED-` en Productos y filtrar una categoría; mostrar uno inactivo.
3. Registrar una entrada válida y revisar su comprobante/historial.
4. En Salidas, elegir lote vigente; intentar una cantidad superior al saldo y
   después una salida válida hacia un área hospitalaria.
5. Filtrar Historial por producto, tipo, área y fechas.
6. Actualizar Indicadores, mostrar stock bajo, vencidos y mayores salidas del periodo.

No afirmar que todo el documento está cerrado sin resolver o acordar la fecha
de RF03, el alcance del login y la integración final a `main`. El despliegue queda
fuera de esta ronda de cierre local.
