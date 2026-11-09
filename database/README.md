# Base de datos

Los scripts de `stored_procedures/` crean/actualizan los procedimientos de los RF01, RF02 y RF03, además de los índices de apoyo.

## Requisitos

- SQL Server accesible.
- `backend/.env` configurado a partir de `backend/.env.example`.

## Aplicar los scripts

Desde la raíz del repositorio:

```bash
backend/.venv/Scripts/python.exe database/apply_stored_procedures.py
```

O desde `backend/` con `uv`:

```bash
uv run python ../database/apply_stored_procedures.py
```

El script ejecuta los archivos en orden alfabético y separa los lotes por `GO`. Los procedimientos usan `CREATE OR ALTER`, por lo que se pueden volver a aplicar sin borrar la base.

> Si ya existen lotes duplicados para un mismo producto y número de lote, el índice único `UX_Lotes_Producto_NumeroLote` no se creará y el script fallará con un mensaje explícito.

## Esquema esperado

Los procedimientos asumen las siguientes tablas y columnas:

- `dbo.Categorias`: `IdCategoria`, `Nombre`, `Descripcion`, `Activo`.
- `dbo.Productos`: `IdProducto`, `Codigo`, `Nombre`, `Descripcion`, `IdCategoria`, `UnidadMedida`, `PrecioUnitario`, `StockMinimo`, `Activo`.
- `dbo.Lotes`: `IdLote`, `IdProducto`, `NumeroLote`, `FechaVencimiento`, `CantidadDisponible`.
- `dbo.HistorialMovimientos`: `IdMovimiento`, `IdProducto`, `IdLote`, `TipoMovimiento`, `Cantidad`, `FechaMovimiento`, `Motivo`, `IdAreaDestino`, `StockAnterior`, `StockPosterior`.

El stock actual no se guarda en `Productos`: se calcula con `SUM(Lotes.CantidadDisponible)`. El historial de entradas usa `TipoMovimiento = 'ENTRADA'` y `FechaMovimiento` en UTC (`SYSUTCDATETIME()`).

