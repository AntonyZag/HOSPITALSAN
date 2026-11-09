SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Productos_IdCategoria'
      AND object_id = OBJECT_ID('dbo.Productos')
)
    CREATE INDEX IX_Productos_IdCategoria ON dbo.Productos(IdCategoria);
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Lotes_Producto_NumeroLote'
      AND object_id = OBJECT_ID('dbo.Lotes')
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.Lotes
        GROUP BY IdProducto, NumeroLote
        HAVING COUNT(*) > 1
    )
        THROW 50010, 'No se puede crear el indice unico de lotes: existen lotes duplicados por producto y numero de lote.', 1;

    CREATE UNIQUE INDEX UX_Lotes_Producto_NumeroLote ON dbo.Lotes(IdProducto, NumeroLote);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Lotes_FechaVencimiento'
      AND object_id = OBJECT_ID('dbo.Lotes')
)
    CREATE INDEX IX_Lotes_FechaVencimiento ON dbo.Lotes(FechaVencimiento);
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_HistorialMovimientos_IdProducto_FechaMovimiento'
      AND object_id = OBJECT_ID('dbo.HistorialMovimientos')
)
    CREATE INDEX IX_HistorialMovimientos_IdProducto_FechaMovimiento
        ON dbo.HistorialMovimientos(IdProducto, FechaMovimiento);
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_HistorialMovimientos_TipoMovimiento_FechaMovimiento'
      AND object_id = OBJECT_ID('dbo.HistorialMovimientos')
)
    CREATE INDEX IX_HistorialMovimientos_TipoMovimiento_FechaMovimiento
        ON dbo.HistorialMovimientos(TipoMovimiento, FechaMovimiento);
GO
