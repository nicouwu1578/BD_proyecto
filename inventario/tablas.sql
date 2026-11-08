-- 01_tablas

CREATE TABLE ciudad (
    id_ciudad     INT          PRIMARY KEY,
    ciudad        VARCHAR(30)  NOT NULL,
    departamento  VARCHAR(30)  NOT NULL,
    CONSTRAINT uq_ciudad_departamento UNIQUE (ciudad, departamento)
);

CREATE TABLE tercero (
    cedula_tercero  BIGINT        PRIMARY KEY,
    nombre_tercero  VARCHAR(100)  NOT NULL,
    relacion        VARCHAR(10)   NOT NULL
        CONSTRAINT ck_tercero_relacion
        CHECK (relacion IN ('Proveedor', 'Cliente', 'Ambos')),
    tipo_tercero    VARCHAR(20)   NULL
        CONSTRAINT ck_tercero_tipo
        CHECK (tipo_tercero IN ('Taller', 'Distribuidor', 'Otros', 'Persona')),
    id_ciudad       INT           NOT NULL
        CONSTRAINT fk_tercero_ciudad REFERENCES ciudad (id_ciudad),
    CONSTRAINT ck_tercero_cliente_tipo
        CHECK (relacion = 'Proveedor' OR tipo_tercero IS NOT NULL),
    CONSTRAINT ck_tercero_cedula_positiva CHECK (cedula_tercero > 0)
);

CREATE TABLE usuario (
    id_usuario  INT           PRIMARY KEY,
    usuario     VARCHAR(100)  NOT NULL,
    rol         VARCHAR(20)   NOT NULL
        CONSTRAINT ck_usuario_rol
        CHECK (rol IN ('Admin', 'Ventas', 'Bodega', 'Compras')),
    auth_id     UUID          NULL UNIQUE
        CONSTRAINT fk_usuario_auth REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE TABLE bodega (
    id_bodega  INT          PRIMARY KEY,
    bodega     VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE categoria (
    id_categoria  INT          PRIMARY KEY,
    categoria     VARCHAR(50)  NOT NULL UNIQUE,
    linea         VARCHAR(15)  NOT NULL
        CONSTRAINT ck_categoria_linea
        CHECK (linea IN ('Automotriz', 'Industrial'))
);

CREATE TABLE material (
    id_material  INT          PRIMARY KEY,
    material     VARCHAR(50)  NOT NULL UNIQUE
);

CREATE TABLE producto (
    codigo        VARCHAR(10)    PRIMARY KEY,
    producto      VARCHAR(100)   NOT NULL,
    diametro_mm   NUMERIC(5,2)   NOT NULL CONSTRAINT ck_producto_diametro CHECK (diametro_mm > 0),
    paso_mm       NUMERIC(4,2)   NULL     CONSTRAINT ck_producto_paso     CHECK (paso_mm > 0),
    longitud_mm   NUMERIC(6,2)   NOT NULL CONSTRAINT ck_producto_longitud CHECK (longitud_mm > 0),
    grado         VARCHAR(10)    NULL,
    id_material   INT            NOT NULL
        CONSTRAINT fk_producto_material  REFERENCES material (id_material),
    id_categoria  INT            NOT NULL
        CONSTRAINT fk_producto_categoria REFERENCES categoria (id_categoria),
    precio_venta  NUMERIC(12,2)  NOT NULL CONSTRAINT ck_producto_precio CHECK (precio_venta > 0),
    cantidad      INT            NOT NULL DEFAULT 0
        CONSTRAINT ck_producto_cantidad CHECK (cantidad >= 0),
    CONSTRAINT uq_producto_medidas
        UNIQUE NULLS NOT DISTINCT (diametro_mm, paso_mm, longitud_mm, grado, id_material)
);

CREATE TABLE movimiento (
    nro_remision       VARCHAR(10)  PRIMARY KEY,
    fecha              DATE         NOT NULL DEFAULT CURRENT_DATE,
    estado             VARCHAR(10)  NOT NULL DEFAULT 'Activa'
        CONSTRAINT ck_movimiento_estado
        CHECK (estado IN ('Activa', 'Anulada', 'Realizado')),
    tipo_movimiento    VARCHAR(10)  NOT NULL
        CONSTRAINT ck_movimiento_tipo
        CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Ajuste')),
    id_usuario         INT          NOT NULL
        CONSTRAINT fk_movimiento_usuario REFERENCES usuario (id_usuario),
    id_tercero         BIGINT       NULL
        CONSTRAINT fk_movimiento_tercero REFERENCES tercero (cedula_tercero),
    id_bodega          INT          NOT NULL DEFAULT 6769
        CONSTRAINT fk_movimiento_bodega REFERENCES bodega (id_bodega),
    CONSTRAINT ck_movimiento_tercero_ajuste
        CHECK ((tipo_movimiento = 'Ajuste') = (id_tercero IS NULL))
);

CREATE TABLE detalle_movimiento (
    nro_remision     VARCHAR(10)    NOT NULL
        CONSTRAINT fk_detalle_movimiento REFERENCES movimiento (nro_remision),
    codigo_producto  VARCHAR(10)    NOT NULL
        CONSTRAINT fk_detalle_producto   REFERENCES producto (codigo),
    cantidad         INT            NOT NULL CONSTRAINT ck_detalle_cantidad CHECK (cantidad <> 0),
    precio_unitario  NUMERIC(12,2)  NOT NULL CONSTRAINT ck_detalle_precio    CHECK (precio_unitario > 0),
    CONSTRAINT pk_detalle_movimiento PRIMARY KEY (nro_remision, codigo_producto)
);
CREATE TABLE auditoria (
    id_auditoria        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha               TIMESTAMPTZ   NOT NULL DEFAULT now(),
    tabla               VARCHAR(50)   NOT NULL,
    operacion           VARCHAR(10)   NOT NULL
        CONSTRAINT ck_auditoria_operacion CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id         TEXT,
    datos_anteriores    JSONB,
    datos_nuevos        JSONB,
    campos_modificados  TEXT[],
    usuario_bd          TEXT          NOT NULL DEFAULT session_user,
    usuario_app         UUID          DEFAULT auth.uid(),
    email_app           TEXT          DEFAULT (auth.jwt() ->> 'email')
);

CREATE TABLE permiso_movimiento (
    rol              VARCHAR(20)  NOT NULL
        CONSTRAINT ck_permiso_rol
        CHECK (rol IN ('Admin', 'Ventas', 'Bodega', 'Compras')),
    tipo_movimiento  VARCHAR(10)  NOT NULL
        CONSTRAINT ck_permiso_tipo
        CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Ajuste')),
    CONSTRAINT pk_permiso_movimiento PRIMARY KEY (rol, tipo_movimiento)
);