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
