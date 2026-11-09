CREATE OR ALTER PROCEDURE dbo.usp_Producto_Listar
    @Busqueda VARCHAR(120) = NULL,
    @IdCategoria INT = NULL,
    @Activo BIT = NULL,
    @SoloStockBajo BIT = 0,
    @DiasVencimiento INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.IdProducto AS id_producto,
           p.Codigo AS codigo,
           p.Nombre AS nombre,
           p.Descripcion AS descripcion,
           p.IdCategoria AS id_categoria,
           c.Nombre AS nombre_categoria,
           p.UnidadMedida AS unidad_medida,
           p.PrecioUnitario AS precio_unitario,
           p.StockMinimo AS stock_minimo,
           p.Activo AS activo,
           ISNULL(s.StockActual, 0) AS stock_actual,
           s.ProximoVencimiento AS proximo_vencimiento
    FROM dbo.Productos p
    INNER JOIN dbo.Categorias c ON c.IdCategoria = p.IdCategoria
    OUTER APPLY (
        SELECT SUM(l.CantidadDisponible) AS StockActual,
               MIN(CASE WHEN l.CantidadDisponible > 0 THEN l.FechaVencimiento END) AS ProximoVencimiento
        FROM dbo.Lotes l
        WHERE l.IdProducto = p.IdProducto
    ) s
    WHERE (@Busqueda IS NULL OR p.Codigo LIKE '%' + @Busqueda + '%' OR p.Nombre LIKE '%' + @Busqueda + '%')
      AND (@IdCategoria IS NULL OR p.IdCategoria = @IdCategoria)
      AND (@Activo IS NULL OR p.Activo = @Activo)
      AND (@SoloStockBajo = 0 OR ISNULL(s.StockActual, 0) <= p.StockMinimo)
      AND (
            @DiasVencimiento IS NULL
            OR EXISTS (
                SELECT 1
                FROM dbo.Lotes l2
                WHERE l2.IdProducto = p.IdProducto
                  AND l2.CantidadDisponible > 0
                  AND l2.FechaVencimiento >= CAST(GETDATE() AS date)
                  AND l2.FechaVencimiento <= DATEADD(day, @DiasVencimiento, CAST(GETDATE() AS date))
            )
      )
    ORDER BY p.Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Producto_Obtener
    @IdProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE IdProducto = @IdProducto)
        THROW 50001, 'El producto no existe.', 1;

    SELECT p.IdProducto AS id_producto,
           p.Codigo AS codigo,
           p.Nombre AS nombre,
           p.Descripcion AS descripcion,
           p.IdCategoria AS id_categoria,
           c.Nombre AS nombre_categoria,
           p.UnidadMedida AS unidad_medida,
           p.PrecioUnitario AS precio_unitario,
           p.StockMinimo AS stock_minimo,
           p.Activo AS activo,
           ISNULL(s.StockActual, 0) AS stock_actual,
           s.ProximoVencimiento AS proximo_vencimiento
    FROM dbo.Productos p
    INNER JOIN dbo.Categorias c ON c.IdCategoria = p.IdCategoria
    OUTER APPLY (
        SELECT SUM(l.CantidadDisponible) AS StockActual,
               MIN(CASE WHEN l.CantidadDisponible > 0 THEN l.FechaVencimiento END) AS ProximoVencimiento
        FROM dbo.Lotes l
        WHERE l.IdProducto = p.IdProducto
    ) s
    WHERE p.IdProducto = @IdProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Producto_Registrar
    @Codigo VARCHAR(30),
    @Nombre VARCHAR(120),
    @Descripcion VARCHAR(500) = NULL,
    @IdCategoria INT,
    @UnidadMedida VARCHAR(20),
    @PrecioUnitario DECIMAL(12,2),
    @StockMinimo INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Codigo IS NULL OR LTRIM(RTRIM(@Codigo)) = ''
        THROW 50003, 'El codigo del producto es obligatorio.', 1;

    IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        THROW 50003, 'El nombre del producto es obligatorio.', 1;

    IF @UnidadMedida IS NULL OR LTRIM(RTRIM(@UnidadMedida)) = ''
        THROW 50003, 'La unidad de medida es obligatoria.', 1;

    IF @PrecioUnitario IS NULL OR @PrecioUnitario <= 0
        THROW 50003, 'El precio unitario debe ser mayor que cero.', 1;

    IF @StockMinimo IS NULL OR @StockMinimo <= 0
        THROW 50003, 'El stock minimo debe ser mayor que cero.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Categorias
        WHERE IdCategoria = @IdCategoria
          AND Activo = 1
    )
        THROW 50003, 'La categoria no existe o esta inactiva.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Productos WHERE Codigo = @Codigo)
        THROW 50002, 'Ya existe un producto con ese codigo.', 1;

    INSERT INTO dbo.Productos
        (Codigo, Nombre, Descripcion, IdCategoria, UnidadMedida, PrecioUnitario, StockMinimo, Activo)
    VALUES
        (@Codigo, @Nombre, @Descripcion, @IdCategoria, @UnidadMedida, @PrecioUnitario, @StockMinimo, 1);

    DECLARE @IdProducto INT = SCOPE_IDENTITY();

    EXEC dbo.usp_Producto_Obtener @IdProducto = @IdProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Producto_Actualizar
    @IdProducto INT,
    @Codigo VARCHAR(30),
    @Nombre VARCHAR(120),
    @Descripcion VARCHAR(500) = NULL,
    @IdCategoria INT,
    @UnidadMedida VARCHAR(20),
    @PrecioUnitario DECIMAL(12,2),
    @StockMinimo INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE IdProducto = @IdProducto)
        THROW 50001, 'El producto no existe.', 1;

    IF @Codigo IS NULL OR LTRIM(RTRIM(@Codigo)) = ''
        THROW 50003, 'El codigo del producto es obligatorio.', 1;

    IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        THROW 50003, 'El nombre del producto es obligatorio.', 1;

    IF @UnidadMedida IS NULL OR LTRIM(RTRIM(@UnidadMedida)) = ''
        THROW 50003, 'La unidad de medida es obligatoria.', 1;

    IF @PrecioUnitario IS NULL OR @PrecioUnitario <= 0
        THROW 50003, 'El precio unitario debe ser mayor que cero.', 1;

    IF @StockMinimo IS NULL OR @StockMinimo <= 0
        THROW 50003, 'El stock minimo debe ser mayor que cero.', 1;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Categorias
        WHERE IdCategoria = @IdCategoria
          AND Activo = 1
    )
        THROW 50003, 'La categoria no existe o esta inactiva.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Productos
        WHERE Codigo = @Codigo
          AND IdProducto <> @IdProducto
    )
        THROW 50002, 'Ya existe un producto con ese codigo.', 1;

    UPDATE dbo.Productos
    SET Codigo = @Codigo,
        Nombre = @Nombre,
        Descripcion = @Descripcion,
        IdCategoria = @IdCategoria,
        UnidadMedida = @UnidadMedida,
        PrecioUnitario = @PrecioUnitario,
        StockMinimo = @StockMinimo
    WHERE IdProducto = @IdProducto;

    EXEC dbo.usp_Producto_Obtener @IdProducto = @IdProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Producto_CambiarEstado
    @IdProducto INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE IdProducto = @IdProducto)
        THROW 50001, 'El producto no existe.', 1;

    UPDATE dbo.Productos
    SET Activo = @Activo
    WHERE IdProducto = @IdProducto;

    EXEC dbo.usp_Producto_Obtener @IdProducto = @IdProducto;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Producto_ProximosVencer
    @Dias INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    IF @Dias IS NULL OR @Dias < 1
        THROW 50003, 'Los dias deben ser mayores que cero.', 1;

    SELECT p.IdProducto AS id_producto,
           p.Codigo AS codigo,
           p.Nombre AS nombre,
           p.Activo AS activo,
           l.IdLote AS id_lote,
           l.NumeroLote AS numero_lote,
           l.FechaVencimiento AS fecha_vencimiento,
           l.CantidadDisponible AS cantidad_disponible,
           DATEDIFF(day, CAST(GETDATE() AS date), l.FechaVencimiento) AS dias_restantes
    FROM dbo.Lotes l
    INNER JOIN dbo.Productos p ON p.IdProducto = l.IdProducto
    WHERE l.CantidadDisponible > 0
      AND l.FechaVencimiento >= CAST(GETDATE() AS date)
      AND l.FechaVencimiento <= DATEADD(day, @Dias, CAST(GETDATE() AS date))
    ORDER BY l.FechaVencimiento, p.Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Lote_ListarPorProducto
    @IdProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE IdProducto = @IdProducto)
        THROW 50001, 'El producto no existe.', 1;

    SELECT l.IdLote AS id_lote,
           l.IdProducto AS id_producto,
           l.NumeroLote AS numero_lote,
           l.FechaVencimiento AS fecha_vencimiento,
           l.CantidadDisponible AS cantidad_disponible
    FROM dbo.Lotes l
    WHERE l.IdProducto = @IdProducto
    ORDER BY l.FechaVencimiento, l.NumeroLote;
END;
GO
