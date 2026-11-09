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
