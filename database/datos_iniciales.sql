-- Ejecutar despues de script_completo_bd.sql, exclusivamente en HospitalSanGabriel.
-- Catalogo con presentaciones concretas y precios referenciales para la sustentacion.
-- Usa las mismas operaciones que el frontend; no inserta stock ni historial directamente.
USE [HospitalSanGabriel];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Los codigos anteriores permiten corregir solo la carga generica agregada previamente.
DECLARE @Datos TABLE (
    Orden INT PRIMARY KEY, CodigoAnterior VARCHAR(30), NombreAnterior NVARCHAR(120),
    Codigo VARCHAR(30), Nombre NVARCHAR(120), Descripcion NVARCHAR(500),
    Categoria NVARCHAR(80), Unidad VARCHAR(20), Precio DECIMAL(12,2),
    Minimo INT, Cantidad INT, Retiro INT, DiasVencimiento INT,
    NumeroLote VARCHAR(50), MotivoEntrada NVARCHAR(50), MotivoSalida NVARCHAR(50),
    Area NVARCHAR(100), Activo BIT
);
INSERT INTO @Datos VALUES
(1,'DEMO-001',N'Paracetamol 500 mg - demo','MED-001',N'Paracetamol 500 mg',
 N'Tabletas de 500 mg. Caja con 100 tabletas en blíster.',
 N'Medicamentos','Caja x 100',12.50,20,100,20,180,'PAR-2611-01',N'Compra a proveedor farmacéutico',N'Abastecimiento de farmacia de emergencia',N'Emergencia',1),
(2,'DEMO-002',N'Amoxicilina 500 mg - demo','MED-002',N'Amoxicilina 500 mg',
 N'Cápsulas de 500 mg. Caja con 100 cápsulas en blíster.',
 N'Medicamentos','Caja x 100',24.90,15,12,5,15,'AMX-2611-02',N'Compra a distribuidor farmacéutico',N'Entrega a farmacia de hospitalización',N'Hospitalización',1),
(3,'DEMO-003',N'Suero fisiologico 0.9% - demo','MED-003',N'Cloruro de sodio 0.9% de 500 ml',
 N'Solución en frasco de 500 ml, con envase individual sellado.',
 N'Medicamentos','Frasco 500 ml',8.50,20,30,10,120,'CSO-2611-03',N'Compra de soluciones envasadas',N'Abastecimiento del almacén de emergencia',N'Emergencia',1),
(4,'DEMO-004',N'Guantes esteriles - demo','INS-001',N'Guantes quirúrgicos estériles talla 7',
 N'Guantes de látex, talla 7. Sobre individual con un par estéril.',
 N'Material médico','Par',3.50,20,80,15,365,'GUE-2611-04',N'Compra de material médico estéril',N'Reposición de material de consultorios',N'Consultorios externos',1),
(5,'DEMO-005',N'Mascarillas quirurgicas - demo','INS-002',N'Mascarilla quirúrgica de tres capas',
 N'Mascarilla descartable con elásticos y ajuste nasal. Caja de 50 unidades.',
 N'Material médico','Caja x 50',15.00,10,5,0,25,'MAS-2611-05',N'Donación de material médico',N'Reposición de material de emergencia',N'Emergencia',1),
(6,'DEMO-006',N'Gasas esteriles - demo','INS-003',N'Gasa estéril de 10 x 10 cm',
 N'Gasa de algodón de 10 x 10 cm. Sobre sellado con 10 unidades.',
 N'Material médico','Sobre x 10',7.20,10,20,20,240,'GAS-2611-06',N'Compra de material para curaciones',N'Reposición de material de curaciones',N'Hospitalización',1),
(7,'DEMO-007',N'Tubos para muestras - demo','LAB-001',N'Tubo para extracción con EDTA K2 de 4 ml',
 N'Tubo de extracción de 4 ml con tapa lila. Caja con 100 tubos.',
 N'Material de laboratorio','Caja x 100',28.00,10,45,5,180,'TED-2611-07',N'Compra de insumos de laboratorio',N'Abastecimiento del área de laboratorio',N'Laboratorio',1),
(8,'DEMO-008',N'Reactivo de glucosa - demo','LAB-002',N'Reactivo enzimático de glucosa de 500 ml',
 N'Reactivo para determinación de glucosa. Presentación en frasco de 500 ml.',
 N'Material de laboratorio','Frasco 500 ml',68.00,8,6,0,90,'RGL-2611-08',N'Compra de reactivos de laboratorio',N'Reposición de reactivos de laboratorio',N'Laboratorio',1),
(9,'DEMO-009',N'Frascos para muestras - demo','LAB-003',N'Frasco estéril para orina de 100 ml',
 N'Recipiente graduado de 100 ml con tapa rosca y empaque individual.',
 N'Material de laboratorio','Unidad',2.50,10,35,5,60,'FMO-2611-09',N'Compra de recipientes para muestras',N'Reposición de recipientes para muestras',N'Laboratorio',1),
(10,'DEMO-010',N'Alcohol al 70% - demo','LIM-001',N'Alcohol etílico al 70% de 1 litro',
 N'Alcohol etílico al 70%, en botella de 1 litro con tapa de seguridad.',
 N'Productos de limpieza hospitalaria','Botella 1 L',11.00,10,50,10,365,'ALC-2611-10',N'Compra de suministros de limpieza',N'Abastecimiento de limpieza de consultorios',N'Consultorios externos',1),
(11,'DEMO-011',N'Desinfectante de superficies - demo','LIM-002',N'Desinfectante de superficies de 1 litro',
 N'Desinfectante líquido para superficies lavables. Botella de 1 litro.',
 N'Productos de limpieza hospitalaria','Botella 1 L',19.90,5,15,3,10,'DES-2611-11',N'Compra de suministros de limpieza',N'Reposición de limpieza de hospitalización',N'Hospitalización',1),
(12,'DEMO-012',N'Detergente enzimatico - demo','LIM-003',N'Detergente enzimático de 1 litro',
 N'Detergente enzimático líquido. Frasco de 1 litro con tapa dosificadora.',
 N'Productos de limpieza hospitalaria','Frasco 1 L',36.00,5,8,0,210,'DEN-2611-12',N'Compra de suministros de limpieza',N'Reposición de limpieza de laboratorio',N'Laboratorio',0);

-- Captura las respuestas normales de los procedimientos, igual que los comprobantes de la API.
DECLARE @Producto TABLE (
    Id INT, Codigo VARCHAR(30), Nombre VARCHAR(120), Descripcion VARCHAR(500),
    IdCategoria INT, Categoria VARCHAR(80), Unidad VARCHAR(20), Precio DECIMAL(12,2),
    Minimo INT, Activo BIT, Stock INT, Vencimiento DATE
);
DECLARE @Entrada TABLE (
    Id BIGINT, Producto INT, Nombre VARCHAR(120), Lote INT, Numero VARCHAR(50),
    Tipo VARCHAR(10), Cantidad INT, Fecha DATETIME2(0), Motivo VARCHAR(50),
    Anterior INT, Posterior INT
);
DECLARE @Salida TABLE (
    Id BIGINT, Producto INT, Nombre VARCHAR(120), Lote INT, Numero VARCHAR(50),
    Tipo VARCHAR(10), Cantidad INT, Fecha DATETIME2(0), Motivo VARCHAR(50),
    Area INT, NombreArea VARCHAR(100), Anterior INT, Posterior INT
);

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @Bloqueo INT;
    EXEC @Bloqueo=sys.sp_getapplock @Resource=N'HospitalSanGabriel_Catalogo12',
        @LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
    IF @Bloqueo<0 THROW 50003,'Otra carga del catalogo esta en curso. Reintenta.',1;

    DECLARE @Orden INT=1,@CodigoAnterior VARCHAR(30),@NombreAnterior NVARCHAR(120),
        @Codigo VARCHAR(30),@Nombre NVARCHAR(120),@Descripcion NVARCHAR(500),
        @Categoria NVARCHAR(80),@Unidad VARCHAR(20),@Precio DECIMAL(12,2),
        @Minimo INT,@Cantidad INT,@Retiro INT,@Dias INT,@Numero VARCHAR(50),
        @MotivoEntrada NVARCHAR(50),@MotivoSalida NVARCHAR(50),@Area NVARCHAR(100),
        @Activo BIT,@IdProducto INT,@IdAnterior INT,@IdCategoria INT,@IdLote INT,
        @IdArea INT,@Vence DATE,@Nuevos INT=0,@Actualizados INT=0,@Conservados INT=0,
        @Hoy DATE=CONVERT(DATE,DATEADD(hour,-5,SYSUTCDATETIME()));

    WHILE @Orden<=12
    BEGIN
        SELECT @CodigoAnterior=CodigoAnterior,@NombreAnterior=NombreAnterior,
            @Codigo=Codigo,@Nombre=Nombre,@Descripcion=Descripcion,@Categoria=Categoria,
            @Unidad=Unidad,@Precio=Precio,@Minimo=Minimo,@Cantidad=Cantidad,
            @Retiro=Retiro,@Dias=DiasVencimiento,@Numero=NumeroLote,
            @MotivoEntrada=MotivoEntrada,@MotivoSalida=MotivoSalida,@Area=Area,@Activo=Activo
        FROM @Datos WHERE Orden=@Orden;
        SET @IdProducto=NULL; SET @IdAnterior=NULL; SET @IdCategoria=NULL;
        SELECT @IdProducto=IdProducto FROM dbo.Productos WHERE Codigo=@Codigo;
        SELECT @IdAnterior=IdProducto FROM dbo.Productos
        WHERE Codigo=@CodigoAnterior AND Nombre=@NombreAnterior
            AND Descripcion='Producto de demostracion - datos ficticios';

        -- Un codigo ocupado por otra persona cancela la transaccion; nunca fusiona registros.
        IF @IdProducto IS NOT NULL AND EXISTS (
            SELECT 1 FROM dbo.Productos WHERE IdProducto=@IdProducto AND Nombre<>@Nombre)
            THROW 50003,'Un codigo del catalogo pertenece a otro producto. Revisa antes de cargar.',1;
        IF @IdProducto IS NOT NULL AND @IdAnterior IS NOT NULL
            THROW 50003,'Existen el producto anterior y el nuevo. Revisa los duplicados.',1;
        IF @IdProducto IS NULL AND @IdAnterior IS NULL
            AND EXISTS (SELECT 1 FROM dbo.Productos WHERE Codigo=@CodigoAnterior)
            THROW 50003,'El registro anterior fue modificado. Se conserva y se cancela la carga.',1;

        IF @IdAnterior IS NOT NULL OR @IdProducto IS NULL
        BEGIN
            SELECT @IdCategoria=IdCategoria FROM dbo.Categorias WHERE Nombre=@Categoria AND Activo=1;
            IF @IdCategoria IS NULL THROW 50003,'Falta una categoria activa del catalogo.',1;
            DELETE FROM @Producto;

            IF @IdAnterior IS NOT NULL
            BEGIN
                -- Corrige la ficha existente como Editar producto: conserva ID, estado, lotes y movimientos.
                INSERT INTO @Producto EXEC dbo.usp_Producto_Actualizar
                    @IdProducto=@IdAnterior,@Codigo=@Codigo,@Nombre=@Nombre,@Descripcion=@Descripcion,
                    @IdCategoria=@IdCategoria,@UnidadMedida=@Unidad,@PrecioUnitario=@Precio,@StockMinimo=@Minimo;
                SET @Actualizados+=1;
            END
            ELSE
            BEGIN
                -- En una base nueva registra la ficha y su entrada con las mismas validaciones del formulario.
                INSERT INTO @Producto EXEC dbo.usp_Producto_Registrar
                    @Codigo=@Codigo,@Nombre=@Nombre,@Descripcion=@Descripcion,@IdCategoria=@IdCategoria,
                    @UnidadMedida=@Unidad,@PrecioUnitario=@Precio,@StockMinimo=@Minimo;
                SELECT @IdProducto=Id FROM @Producto;
                SET @Vence=DATEADD(day,@Dias,@Hoy);
                DELETE FROM @Entrada;
                INSERT INTO @Entrada EXEC dbo.usp_Entrada_Registrar
                    @IdProducto=@IdProducto,@NumeroLote=@Numero,@FechaVencimiento=@Vence,
                    @Cantidad=@Cantidad,@Motivo=@MotivoEntrada;
                SELECT @IdLote=Lote FROM @Entrada;

                -- Las salidas usan fecha actual, destino real del catalogo de areas y saldo disponible.
                IF @Retiro>0
                BEGIN
                    SET @IdArea=NULL;
                    SELECT @IdArea=IdArea FROM dbo.AreasHospitalarias WHERE NombreArea=@Area;
                    IF @IdArea IS NULL THROW 50003,'Falta un area hospitalaria requerida.',1;
                    DELETE FROM @Salida;
                    INSERT INTO @Salida EXEC dbo.usp_Salida_Registrar
                        @IdProducto=@IdProducto,@IdLote=@IdLote,@Cantidad=@Retiro,
                        @Fecha=@Hoy,@Motivo=@MotivoSalida,@IdAreaDestino=@IdArea;
                END;
                IF @Activo=0
                BEGIN
                    DELETE FROM @Producto;
                    INSERT INTO @Producto EXEC dbo.usp_Producto_CambiarEstado @IdProducto=@IdProducto,@Activo=0;
                END;
                SET @Nuevos+=1;
            END;
        END
        ELSE SET @Conservados+=1;
        SET @Orden+=1;
    END;
    COMMIT TRANSACTION;

    SELECT @Nuevos AS ProductosNuevos,@Actualizados AS FichasActualizadas,@Conservados AS ProductosConservados;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Retira unicamente el cargador generico anterior; conserva los procedimientos del sistema.
DROP PROCEDURE IF EXISTS dbo.usp_Demo_CargarDatos;

SELECT p.IdProducto,p.Codigo,p.Nombre,p.Descripcion,c.Nombre AS Categoria,p.UnidadMedida,
    p.PrecioUnitario,p.StockMinimo,p.Activo,ISNULL(SUM(l.CantidadDisponible),0) AS StockActual
FROM dbo.Productos p JOIN dbo.Categorias c ON c.IdCategoria=p.IdCategoria
LEFT JOIN dbo.Lotes l ON l.IdProducto=p.IdProducto
WHERE p.Codigo IN (SELECT Codigo FROM @Datos)
GROUP BY p.IdProducto,p.Codigo,p.Nombre,p.Descripcion,c.Nombre,p.UnidadMedida,
    p.PrecioUnitario,p.StockMinimo,p.Activo ORDER BY p.Codigo;
GO
