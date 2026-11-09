-- Crea la base si falta y selecciona la base del proyecto.
IF DB_ID(N'HospitalSanGabriel') IS NULL
    CREATE DATABASE HospitalSanGabriel;
GO
USE HospitalSanGabriel;
GO

-- Crea las tablas que falten y conserva las que ya tienen datos.
IF OBJECT_ID(N'dbo.Categorias', N'U') IS NULL
    CREATE TABLE dbo.Categorias (
        IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
        Nombre VARCHAR(80) NOT NULL UNIQUE,
        Descripcion VARCHAR(250),
        Activo BIT DEFAULT 1
    );
GO

IF OBJECT_ID(N'dbo.Productos', N'U') IS NULL
    CREATE TABLE dbo.Productos (
        IdProducto INT IDENTITY(1,1) PRIMARY KEY,
        Codigo VARCHAR(30) NOT NULL UNIQUE,
        Nombre VARCHAR(120) NOT NULL,
        Descripcion VARCHAR(500),
        IdCategoria INT NOT NULL REFERENCES dbo.Categorias(IdCategoria),
        UnidadMedida VARCHAR(20) NOT NULL,
        PrecioUnitario DECIMAL(12,2) NOT NULL CHECK (PrecioUnitario > 0),
        StockMinimo INT NOT NULL CHECK (StockMinimo > 0),
        Activo BIT DEFAULT 1
    );
GO

IF OBJECT_ID(N'dbo.Lotes', N'U') IS NULL
    CREATE TABLE dbo.Lotes (
        IdLote INT IDENTITY(1,1) PRIMARY KEY,
        IdProducto INT NOT NULL REFERENCES dbo.Productos(IdProducto),
        NumeroLote VARCHAR(50) NOT NULL,
        FechaVencimiento DATE NOT NULL,
        CantidadDisponible INT NOT NULL CHECK (CantidadDisponible >= 0)
    );
GO

IF OBJECT_ID(N'dbo.AreasHospitalarias', N'U') IS NULL
    CREATE TABLE dbo.AreasHospitalarias (
        IdArea INT IDENTITY(1,1) PRIMARY KEY,
        NombreArea VARCHAR(100) NOT NULL UNIQUE
    );
GO

IF OBJECT_ID(N'dbo.HistorialMovimientos', N'U') IS NULL
    CREATE TABLE dbo.HistorialMovimientos (
        IdMovimiento BIGINT IDENTITY(1,1) PRIMARY KEY,
        IdProducto INT NOT NULL REFERENCES dbo.Productos(IdProducto),
        IdLote INT REFERENCES dbo.Lotes(IdLote),
        TipoMovimiento VARCHAR(10) NOT NULL CHECK (TipoMovimiento IN ('ENTRADA', 'SALIDA')),
        Cantidad INT NOT NULL CHECK (Cantidad > 0),
        FechaMovimiento DATETIME2(0) DEFAULT SYSUTCDATETIME(),
        Motivo VARCHAR(50) NOT NULL,
        IdAreaDestino INT NULL REFERENCES dbo.AreasHospitalarias(IdArea),
        StockAnterior INT NOT NULL,
        StockPosterior INT NOT NULL
    );
GO

-- Agrega las categorías iniciales que todavía no existen.
INSERT INTO dbo.Categorias (Nombre, Activo)
SELECT inicial.Nombre, 1
FROM (VALUES
    ('Medicamentos'),
    ('Material médico'),
    ('Material de laboratorio'),
    ('Productos de limpieza hospitalaria')
) inicial(Nombre)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Categorias WITH (UPDLOCK, HOLDLOCK)
    WHERE Nombre = inicial.Nombre
);
GO

-- Carga las áreas básicas si todavía no existen.
INSERT INTO dbo.AreasHospitalarias (NombreArea)
SELECT areas.NombreArea
FROM (VALUES ('Emergencia'), ('Hospitalización'), ('Consultorios externos'), ('Laboratorio')) areas(NombreArea)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.AreasHospitalarias WITH (UPDLOCK, HOLDLOCK)
    WHERE NombreArea = areas.NombreArea
);
GO

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

CREATE OR ALTER PROCEDURE dbo.usp_Categoria_Listar
    @SoloActivas BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    SELECT c.IdCategoria AS id_categoria,
           c.Nombre AS nombre,
           c.Descripcion AS descripcion,
           c.Activo AS activo,
           COUNT(p.IdProducto) AS cantidad_productos
    FROM dbo.Categorias c
    LEFT JOIN dbo.Productos p ON p.IdCategoria = c.IdCategoria
    WHERE (@SoloActivas = 0 OR c.Activo = 1)
    GROUP BY c.IdCategoria, c.Nombre, c.Descripcion, c.Activo
    ORDER BY c.Nombre;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Categoria_Registrar
    @Nombre VARCHAR(80),
    @Descripcion VARCHAR(250) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        THROW 50003, 'El nombre de la categoria es obligatorio.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Categorias WHERE Nombre = @Nombre)
        THROW 50002, 'Ya existe una categoria con ese nombre.', 1;

    INSERT INTO dbo.Categorias (Nombre, Descripcion, Activo)
    VALUES (@Nombre, @Descripcion, 1);

    DECLARE @IdCategoria INT = SCOPE_IDENTITY();

    SELECT c.IdCategoria AS id_categoria,
           c.Nombre AS nombre,
           c.Descripcion AS descripcion,
           c.Activo AS activo,
           0 AS cantidad_productos
    FROM dbo.Categorias c
    WHERE c.IdCategoria = @IdCategoria;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Categoria_Actualizar
    @IdCategoria INT,
    @Nombre VARCHAR(80),
    @Descripcion VARCHAR(250) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE IdCategoria = @IdCategoria)
        THROW 50001, 'La categoria no existe.', 1;

    IF @Nombre IS NULL OR LTRIM(RTRIM(@Nombre)) = ''
        THROW 50003, 'El nombre de la categoria es obligatorio.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Categorias
        WHERE Nombre = @Nombre
          AND IdCategoria <> @IdCategoria
    )
        THROW 50002, 'Ya existe una categoria con ese nombre.', 1;

    UPDATE dbo.Categorias
    SET Nombre = @Nombre,
        Descripcion = @Descripcion
    WHERE IdCategoria = @IdCategoria;

    SELECT c.IdCategoria AS id_categoria,
           c.Nombre AS nombre,
           c.Descripcion AS descripcion,
           c.Activo AS activo,
           (SELECT COUNT(*) FROM dbo.Productos p WHERE p.IdCategoria = c.IdCategoria) AS cantidad_productos
    FROM dbo.Categorias c
    WHERE c.IdCategoria = @IdCategoria;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Categoria_CambiarEstado
    @IdCategoria INT,
    @Activo BIT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Categorias WHERE IdCategoria = @IdCategoria)
        THROW 50001, 'La categoria no existe.', 1;

    IF @Activo = 0
       AND EXISTS (SELECT 1 FROM dbo.Productos WHERE IdCategoria = @IdCategoria)
        THROW 50003, 'No se puede desactivar una categoria que tiene productos asociados.', 1;


    UPDATE dbo.Categorias
    SET Activo = @Activo
    WHERE IdCategoria = @IdCategoria;

    SELECT c.IdCategoria AS id_categoria,
           c.Nombre AS nombre,
           c.Descripcion AS descripcion,
           c.Activo AS activo,
           (SELECT COUNT(*) FROM dbo.Productos p WHERE p.IdCategoria = c.IdCategoria) AS cantidad_productos
    FROM dbo.Categorias c
    WHERE c.IdCategoria = @IdCategoria;
END;
GO

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

CREATE OR ALTER PROCEDURE dbo.usp_Entrada_Registrar
    @IdProducto INT,
    @NumeroLote VARCHAR(50),
    @FechaVencimiento DATE,
    @Cantidad INT,
    @Motivo VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @IdProducto IS NULL OR @IdProducto <= 0
        THROW 50003, 'El producto es obligatorio.', 1;

    IF @NumeroLote IS NULL OR LTRIM(RTRIM(@NumeroLote)) = ''
        THROW 50003, 'El numero de lote es obligatorio.', 1;

    IF LEN(@NumeroLote) > 50
        THROW 50003, 'El numero de lote no puede superar los 50 caracteres.', 1;

    IF @FechaVencimiento IS NULL
        THROW 50003, 'La fecha de vencimiento es obligatoria.', 1;

    IF @FechaVencimiento < CAST(GETDATE() AS date)
        THROW 50003, 'La fecha de vencimiento no puede ser anterior a hoy.', 1;

    IF @Cantidad IS NULL OR @Cantidad <= 0
        THROW 50003, 'La cantidad debe ser mayor que cero.', 1;

    IF @Motivo IS NULL OR LTRIM(RTRIM(@Motivo)) = ''
        THROW 50003, 'El motivo es obligatorio.', 1;

    IF LEN(@Motivo) > 50
        THROW 50003, 'El motivo no puede superar los 50 caracteres.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM dbo.Productos WITH (UPDLOCK, HOLDLOCK)
            WHERE IdProducto = @IdProducto
              AND Activo = 1
        )
            THROW 50003, 'El producto no existe o esta inactivo.', 1;

        DECLARE @IdLote INT;
        DECLARE @FechaExistente DATE;

        SELECT @IdLote = l.IdLote,
               @FechaExistente = l.FechaVencimiento
        FROM dbo.Lotes l WITH (UPDLOCK, HOLDLOCK)
        WHERE l.IdProducto = @IdProducto
          AND l.NumeroLote = @NumeroLote;

        IF @IdLote IS NOT NULL AND @FechaExistente <> @FechaVencimiento
            THROW 50003, 'El lote ya existe con una fecha de vencimiento diferente.', 1;

        DECLARE @StockAnterior INT;

        SELECT @StockAnterior = ISNULL(SUM(l.CantidadDisponible), 0)
        FROM dbo.Lotes l WITH (UPDLOCK, HOLDLOCK)
        WHERE l.IdProducto = @IdProducto;

        IF @IdLote IS NOT NULL
        BEGIN
            UPDATE dbo.Lotes
            SET CantidadDisponible = CantidadDisponible + @Cantidad
            WHERE IdLote = @IdLote;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.Lotes (IdProducto, NumeroLote, FechaVencimiento, CantidadDisponible)
            VALUES (@IdProducto, @NumeroLote, @FechaVencimiento, @Cantidad);

            SET @IdLote = SCOPE_IDENTITY();
        END;

        DECLARE @StockPosterior INT = @StockAnterior + @Cantidad;

        INSERT INTO dbo.HistorialMovimientos
            (IdProducto, IdLote, TipoMovimiento, Cantidad, FechaMovimiento, Motivo, IdAreaDestino, StockAnterior, StockPosterior)
        VALUES
            (@IdProducto, @IdLote, 'ENTRADA', @Cantidad, SYSUTCDATETIME(), @Motivo, NULL, @StockAnterior, @StockPosterior);

        DECLARE @IdMovimiento BIGINT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        SELECT h.IdMovimiento AS id_movimiento,
               h.IdProducto AS id_producto,
               p.Nombre AS nombre_producto,
               h.IdLote AS id_lote,
               l.NumeroLote AS numero_lote,
               h.TipoMovimiento AS tipo_movimiento,
               h.Cantidad AS cantidad,
               h.FechaMovimiento AS fecha_movimiento,
               h.Motivo AS motivo,
               h.StockAnterior AS stock_anterior,
               h.StockPosterior AS stock_posterior
        FROM dbo.HistorialMovimientos h
        INNER JOIN dbo.Productos p ON p.IdProducto = h.IdProducto
        INNER JOIN dbo.Lotes l ON l.IdLote = h.IdLote
        WHERE h.IdMovimiento = @IdMovimiento;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Entrada_Listar
    @IdProducto INT = NULL,
    @Desde DATETIME2 = NULL,
    @Hasta DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT h.IdMovimiento AS id_movimiento,
           h.IdProducto AS id_producto,
           p.Nombre AS nombre_producto,
           h.IdLote AS id_lote,
           l.NumeroLote AS numero_lote,
           h.TipoMovimiento AS tipo_movimiento,
           h.Cantidad AS cantidad,
           h.FechaMovimiento AS fecha_movimiento,
           h.Motivo AS motivo,
           h.StockAnterior AS stock_anterior,
           h.StockPosterior AS stock_posterior
    FROM dbo.HistorialMovimientos h
    INNER JOIN dbo.Productos p ON p.IdProducto = h.IdProducto
    LEFT JOIN dbo.Lotes l ON l.IdLote = h.IdLote
    WHERE h.TipoMovimiento = 'ENTRADA'
      AND (@IdProducto IS NULL OR h.IdProducto = @IdProducto)
      AND (@Desde IS NULL OR h.FechaMovimiento >= @Desde)
      AND (@Hasta IS NULL OR h.FechaMovimiento < @Hasta)
    ORDER BY h.FechaMovimiento DESC, h.IdMovimiento DESC;
END;
GO

-- Procedimientos de salidas, historial e indicadores.

-- RF04 y RF05: devuelve las áreas para el formulario y los filtros.
CREATE OR ALTER PROCEDURE dbo.usp_AreaHospitalaria_Listar
AS
BEGIN
    SET NOCOUNT ON;

    SELECT IdArea AS id_area, NombreArea AS nombre_area
    FROM dbo.AreasHospitalarias
    ORDER BY NombreArea;
END;
GO

-- RF04: muestra solo lotes con unidades que aún se pueden usar.
CREATE OR ALTER PROCEDURE dbo.usp_Salida_ListarLotesVigentes
    @IdProducto INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Hoy DATE = CONVERT(DATE, DATEADD(hour, -5, SYSUTCDATETIME()));

    SELECT l.IdLote AS id_lote, l.IdProducto AS id_producto, l.NumeroLote AS numero_lote,
           l.FechaVencimiento AS fecha_vencimiento, l.CantidadDisponible AS cantidad_disponible
    FROM dbo.Lotes l
    INNER JOIN dbo.Productos p ON p.IdProducto = l.IdProducto
    WHERE p.IdProducto = @IdProducto AND p.Activo = 1
      AND l.CantidadDisponible > 0 AND l.FechaVencimiento >= @Hoy
    ORDER BY l.FechaVencimiento, l.NumeroLote, l.IdLote;
END;
GO

-- RF04: descuenta un lote y deja el comprobante del movimiento.
CREATE OR ALTER PROCEDURE dbo.usp_Salida_Registrar
    @IdProducto INT,
    @IdLote INT,
    @Cantidad INT,
    @Fecha DATE,
    @Motivo VARCHAR(MAX),
    @IdAreaDestino INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Comprueba los datos antes de tocar el stock.
    SET @Motivo = LTRIM(RTRIM(@Motivo));
    IF @Cantidad IS NULL OR @Cantidad <= 0
        THROW 50003, 'La cantidad debe ser mayor que cero.', 1;
    IF @Motivo IS NULL OR @Motivo = '' OR DATALENGTH(@Motivo) > 50
        THROW 50003, 'Ingresa un motivo de hasta 50 caracteres.', 1;
    IF @Fecha IS NULL
        THROW 50003, 'La fecha de salida es obligatoria.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Toma el mismo bloqueo de producto que usan las entradas, antes de mirar lotes.
        IF NOT EXISTS (
            SELECT 1
            FROM dbo.Productos WITH (UPDLOCK, HOLDLOCK)
            WHERE IdProducto = @IdProducto AND Activo = 1
        )
            THROW 50003, 'El producto no existe o esta inactivo.', 1;

        -- Revisa la fecha y el lote de nuevo porque el formulario puede tener datos antiguos.
        DECLARE @AhoraUtc DATETIME2(0) = SYSUTCDATETIME();
        DECLARE @Hoy DATE = CONVERT(DATE, DATEADD(hour, -5, @AhoraUtc));
        DECLARE @Disponible INT, @Vencimiento DATE;

        IF @Fecha > @Hoy
            THROW 50003, 'La fecha de salida no puede ser futura.', 1;

        SELECT @Disponible = CantidadDisponible, @Vencimiento = FechaVencimiento
        FROM dbo.Lotes WITH (UPDLOCK, HOLDLOCK)
        WHERE IdLote = @IdLote AND IdProducto = @IdProducto;

        IF @Disponible IS NULL
            THROW 50003, 'El lote no pertenece al producto seleccionado.', 1;
        IF @Vencimiento < @Hoy
            THROW 50003, 'No se puede retirar un lote vencido.', 1;
        IF @Cantidad > @Disponible
            THROW 50002, 'El lote no tiene suficiente stock para esta salida.', 1;
        IF NOT EXISTS (
            SELECT 1 FROM dbo.AreasHospitalarias WITH (HOLDLOCK) WHERE IdArea = @IdAreaDestino
        )
            THROW 50003, 'El area hospitalaria seleccionada no existe.', 1;

        -- Calcula el stock total del producto como en Entradas y descuenta solo el lote elegido.
        DECLARE @StockAnterior INT;
        SELECT @StockAnterior = SUM(CantidadDisponible)
        FROM dbo.Lotes WITH (UPDLOCK, HOLDLOCK)
        WHERE IdProducto = @IdProducto;

        UPDATE dbo.Lotes
        SET CantidadDisponible = CantidadDisponible - @Cantidad
        WHERE IdLote = @IdLote;

        -- Guarda la hora real para hoy o el inicio del día en Lima para una fecha anterior.
        DECLARE @FechaUtc DATETIME2(0) = @AhoraUtc;
        IF @Fecha < @Hoy
            SET @FechaUtc = DATEADD(hour, 5, CONVERT(DATETIME2(0), @Fecha));

        INSERT INTO dbo.HistorialMovimientos
            (IdProducto, IdLote, TipoMovimiento, Cantidad, FechaMovimiento, Motivo,
             IdAreaDestino, StockAnterior, StockPosterior)
        VALUES
            (@IdProducto, @IdLote, 'SALIDA', @Cantidad, @FechaUtc, @Motivo,
             @IdAreaDestino, @StockAnterior, @StockAnterior - @Cantidad);

        DECLARE @IdMovimiento BIGINT = SCOPE_IDENTITY();

        -- Confirma el descuento junto con su historial y devuelve el comprobante.
        COMMIT TRANSACTION;

        SELECT h.IdMovimiento AS id_movimiento, h.IdProducto AS id_producto,
               p.Nombre AS nombre_producto, h.IdLote AS id_lote, l.NumeroLote AS numero_lote,
               h.TipoMovimiento AS tipo_movimiento, h.Cantidad AS cantidad,
               h.FechaMovimiento AS fecha_movimiento, h.Motivo AS motivo,
               h.IdAreaDestino AS id_area_destino, a.NombreArea AS nombre_area,
               h.StockAnterior AS stock_anterior, h.StockPosterior AS stock_posterior
        FROM dbo.HistorialMovimientos h
        INNER JOIN dbo.Productos p ON p.IdProducto = h.IdProducto
        INNER JOIN dbo.Lotes l ON l.IdLote = h.IdLote
        INNER JOIN dbo.AreasHospitalarias a ON a.IdArea = h.IdAreaDestino
        WHERE h.IdMovimiento = @IdMovimiento;
    END TRY
    BEGIN CATCH
        -- Si falla algún paso, deshace tanto el descuento como el movimiento.
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- RF05 y RF06: consulta entradas y salidas, incluso si el producto se desactivó.
CREATE OR ALTER PROCEDURE dbo.usp_Historial_Listar
    @IdProducto INT = NULL,
    @TipoMovimiento VARCHAR(10) = NULL,
    @IdAreaDestino INT = NULL,
    @DesdeUtc DATETIME2(0) = NULL,
    @HastaUtc DATETIME2(0) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- El límite final es el inicio del día siguiente; así se incluye todo el último día.
    SELECT h.IdMovimiento AS id_movimiento, h.IdProducto AS id_producto,
           p.Nombre AS nombre_producto, h.IdLote AS id_lote, l.NumeroLote AS numero_lote,
           h.TipoMovimiento AS tipo_movimiento, h.Cantidad AS cantidad,
           h.FechaMovimiento AS fecha_movimiento, h.Motivo AS motivo,
           h.IdAreaDestino AS id_area_destino, a.NombreArea AS nombre_area,
           h.StockAnterior AS stock_anterior, h.StockPosterior AS stock_posterior
    FROM dbo.HistorialMovimientos h
    INNER JOIN dbo.Productos p ON p.IdProducto = h.IdProducto
    LEFT JOIN dbo.Lotes l ON l.IdLote = h.IdLote
    LEFT JOIN dbo.AreasHospitalarias a ON a.IdArea = h.IdAreaDestino
    WHERE (@IdProducto IS NULL OR h.IdProducto = @IdProducto)
      AND (@TipoMovimiento IS NULL OR h.TipoMovimiento = @TipoMovimiento)
      AND (@IdAreaDestino IS NULL OR h.IdAreaDestino = @IdAreaDestino)
      AND (@DesdeUtc IS NULL OR h.FechaMovimiento >= @DesdeUtc)
      AND (@HastaUtc IS NULL OR h.FechaMovimiento < @HastaUtc)
    ORDER BY h.FechaMovimiento DESC, h.IdMovimiento DESC;
END;
GO

-- RF06: cuenta productos activos y valora el stock físico registrado.
CREATE OR ALTER PROCEDURE dbo.usp_Indicador_Resumen
AS
BEGIN
    SET NOCOUNT ON;

    SELECT (SELECT COUNT(*) FROM dbo.Productos WHERE Activo = 1) AS productos_activos,
           ISNULL(SUM(l.CantidadDisponible * p.PrecioUnitario), 0) AS valor_inventario
    FROM dbo.Lotes l
    INNER JOIN dbo.Productos p ON p.IdProducto = l.IdProducto;
END;
GO

-- RF06: lista productos con stock igual o menor al mínimo, incluso en cero.
CREATE OR ALTER PROCEDURE dbo.usp_Indicador_StockBajo
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.IdProducto AS id_producto, p.Codigo AS codigo, p.Nombre AS nombre_producto,
           p.StockMinimo AS stock_minimo, ISNULL(p.Activo, 0) AS activo,
           ISNULL(SUM(CONVERT(BIGINT, l.CantidadDisponible)), 0) AS stock_actual
    FROM dbo.Productos p
    LEFT JOIN dbo.Lotes l ON l.IdProducto = p.IdProducto
    GROUP BY p.IdProducto, p.Codigo, p.Nombre, p.StockMinimo, p.Activo
    HAVING ISNULL(SUM(CONVERT(BIGINT, l.CantidadDisponible)), 0) <= p.StockMinimo
    ORDER BY stock_actual, p.Nombre, p.IdProducto;
END;
GO

-- RF06: muestra lotes con unidades vencidas o por vencer en los próximos 30 días.
CREATE OR ALTER PROCEDURE dbo.usp_Indicador_Vencimientos
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Hoy DATE = CONVERT(DATE, DATEADD(hour, -5, SYSUTCDATETIME()));

    SELECT l.IdLote AS id_lote, p.Codigo AS codigo, p.Nombre AS nombre_producto,
           l.NumeroLote AS numero_lote, l.FechaVencimiento AS fecha_vencimiento,
           l.CantidadDisponible AS cantidad_disponible,
           CASE WHEN l.FechaVencimiento < @Hoy THEN 'VENCIDO' ELSE 'PROXIMO' END AS estado
    FROM dbo.Lotes l
    INNER JOIN dbo.Productos p ON p.IdProducto = l.IdProducto
    WHERE l.CantidadDisponible > 0 AND l.FechaVencimiento <= DATEADD(day, 30, @Hoy)
    ORDER BY l.FechaVencimiento, p.Nombre, l.IdLote;
END;
GO

-- RF06: ordena productos por unidades retiradas en el rango indicado.
CREATE OR ALTER PROCEDURE dbo.usp_Indicador_MayoresSalidas
    @DesdeUtc DATETIME2(0),
    @HastaUtc DATETIME2(0)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT p.IdProducto AS id_producto, p.Codigo AS codigo, p.Nombre AS nombre_producto,
           SUM(CONVERT(BIGINT, h.Cantidad)) AS unidades_retiradas
    FROM dbo.HistorialMovimientos h
    INNER JOIN dbo.Productos p ON p.IdProducto = h.IdProducto
    WHERE h.TipoMovimiento = 'SALIDA' AND h.FechaMovimiento >= @DesdeUtc
      AND (@HastaUtc IS NULL OR h.FechaMovimiento < @HastaUtc)
    GROUP BY p.IdProducto, p.Codigo, p.Nombre
    ORDER BY unidades_retiradas DESC, p.Nombre, p.IdProducto;
END;
GO
