-- Ejecuta este archivo sobre la base que ya tiene las tablas del hospital.
USE HospitalSanGabriel;
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
