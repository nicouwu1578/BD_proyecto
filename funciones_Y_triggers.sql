-- funciones y triggers

CREATE OR REPLACE FUNCTION fn_usuario_actual()
RETURNS INT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id_usuario FROM usuario WHERE auth_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION fn_rol_actual()
RETURNS VARCHAR
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT rol FROM usuario WHERE auth_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION fn_puede_movimiento(p_tipo VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(
        fn_rol_actual() = 'Admin'
        OR EXISTS (SELECT 1 FROM permiso_movimiento
                   WHERE rol = fn_rol_actual() AND tipo_movimiento = p_tipo),
        false);
$$;

CREATE OR REPLACE FUNCTION fn_validar_tercero_movimiento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_relacion VARCHAR(10);
BEGIN
    IF NEW.tipo_movimiento = 'Ajuste' THEN
        IF NEW.id_tercero IS NOT NULL THEN
            RAISE EXCEPTION 'La remisión % es un Ajuste de stock y no lleva proveedor ni cliente',
                NEW.nro_remision USING ERRCODE = 'P0001';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id_tercero IS NULL THEN
        RAISE EXCEPTION 'La remisión % es un(a) % y necesita un proveedor o cliente',
            NEW.nro_remision, NEW.tipo_movimiento USING ERRCODE = 'P0001';
    END IF;

    SELECT relacion INTO v_relacion FROM tercero WHERE cedula_tercero = NEW.id_tercero;

    IF NEW.tipo_movimiento = 'Entrada' AND v_relacion NOT IN ('Proveedor', 'Ambos') THEN
        RAISE EXCEPTION 'La remisión % es una Entrada (compra) y el tercero % no es proveedor',
            NEW.nro_remision, NEW.id_tercero USING ERRCODE = 'P0001';
    END IF;

    IF NEW.tipo_movimiento = 'Salida' AND v_relacion NOT IN ('Cliente', 'Ambos') THEN
        RAISE EXCEPTION 'La remisión % es una Salida (venta) y el tercero % no es cliente',
            NEW.nro_remision, NEW.id_tercero USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimiento_validar_tercero
BEFORE INSERT OR UPDATE OF tipo_movimiento, id_tercero ON movimiento
FOR EACH ROW EXECUTE FUNCTION fn_validar_tercero_movimiento();

CREATE OR REPLACE FUNCTION fn_proteger_movimiento()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Las remisiones no se borran (remisión %). Use anular_remision()',
            OLD.nro_remision USING ERRCODE = 'P0001';
    END IF;

    IF OLD.estado = 'Anulada' THEN
        RAISE EXCEPTION 'La remisión % está anulada y no se puede modificar',
            OLD.nro_remision USING ERRCODE = 'P0001';
    END IF;

    IF NEW.nro_remision <> OLD.nro_remision THEN
        RAISE EXCEPTION 'No se puede cambiar el número de una remisión' USING ERRCODE = 'P0001';
    END IF;

    IF (NEW.tipo_movimiento IS DISTINCT FROM OLD.tipo_movimiento
        OR NEW.id_bodega IS DISTINCT FROM OLD.id_bodega)
       AND EXISTS (SELECT 1 FROM detalle_movimiento WHERE nro_remision = OLD.nro_remision) THEN
        RAISE EXCEPTION 'La remisión % ya tiene productos: no se puede cambiar el tipo ni la bodega. Anúlela y cree una nueva',
            OLD.nro_remision USING ERRCODE = 'P0001';
    END IF;

    IF auth.uid() IS NOT NULL AND COALESCE(fn_rol_actual(), '') <> 'Admin' THEN
        IF NEW.estado = 'Anulada' THEN
            RAISE EXCEPTION 'Solo un Admin puede anular remisiones' USING ERRCODE = '42501';
        END IF;
        IF (to_jsonb(NEW) - 'estado') <> (to_jsonb(OLD) - 'estado')
           OR NOT (OLD.estado = 'Activa' AND NEW.estado = 'Realizado') THEN
            RAISE EXCEPTION 'Su rol solo puede cambiar el estado de la remisión de Activa a Realizado'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimiento_proteger
BEFORE UPDATE OR DELETE ON movimiento
FOR EACH ROW EXECUTE FUNCTION fn_proteger_movimiento();

CREATE OR REPLACE FUNCTION fn_aplicar_inventario(
    p_tipo      VARCHAR,
    p_codigo    VARCHAR,
    p_cantidad  INT,
    p_signo     INT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_delta  INT;
    v_stock  INT;
BEGIN
    v_delta := CASE p_tipo
                   WHEN 'Entrada'  THEN  p_cantidad
                   WHEN 'Ajuste'   THEN  p_cantidad
                   WHEN 'Salida'   THEN -p_cantidad
                   ELSE 0
               END * p_signo;

    IF v_delta = 0 THEN
        RETURN;
    END IF;

    SELECT cantidad INTO v_stock FROM producto WHERE codigo = p_codigo FOR UPDATE;

    IF v_stock + v_delta < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente para el producto %: hay %, se necesitan %',
            p_codigo, v_stock, abs(v_delta) USING ERRCODE = 'P0001';
    END IF;

    UPDATE producto SET cantidad = cantidad + v_delta WHERE codigo = p_codigo;
END;
$$;

CREATE OR REPLACE FUNCTION fn_detalle_inventario()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_tipo    VARCHAR(10);
    v_estado  VARCHAR(10);
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'No se borran productos de una remisión (remisión %). Anule la remisión',
            OLD.nro_remision USING ERRCODE = 'P0001';
    END IF;

    SELECT tipo_movimiento, estado INTO v_tipo, v_estado
    FROM movimiento WHERE nro_remision = NEW.nro_remision;

    IF v_estado = 'Anulada' THEN
        RAISE EXCEPTION 'La remisión % está anulada: no se le pueden agregar ni cambiar productos',
            NEW.nro_remision USING ERRCODE = 'P0001';
    END IF;

    IF NEW.cantidad < 0 AND v_tipo <> 'Ajuste' THEN
        RAISE EXCEPTION 'Solo los Ajustes pueden restar stock con cantidades negativas (remisión %)',
            NEW.nro_remision USING ERRCODE = 'P0001';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.nro_remision <> OLD.nro_remision THEN
        RAISE EXCEPTION 'No se puede mover un detalle a otra remisión' USING ERRCODE = 'P0001';
    END IF;

    IF NEW.precio_unitario IS NULL THEN
        SELECT precio_venta INTO NEW.precio_unitario FROM producto WHERE codigo = NEW.codigo_producto;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        PERFORM fn_aplicar_inventario(v_tipo, OLD.codigo_producto, OLD.cantidad, -1);
    END IF;

    PERFORM fn_aplicar_inventario(v_tipo, NEW.codigo_producto, NEW.cantidad, 1);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_detalle_inventario
BEFORE INSERT OR UPDATE OR DELETE ON detalle_movimiento
FOR EACH ROW EXECUTE FUNCTION fn_detalle_inventario();

CREATE OR REPLACE FUNCTION fn_proteger_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND pg_trigger_depth() = 1 THEN
        IF TG_OP = 'INSERT' AND NEW.cantidad <> 0 THEN
            RAISE EXCEPTION 'Un producto nuevo empieza con stock 0; el stock se carga con una remisión de Entrada o Ajuste'
                USING ERRCODE = '42501';
        END IF;
        IF TG_OP = 'UPDATE' AND NEW.cantidad <> OLD.cantidad THEN
            RAISE EXCEPTION 'El stock no se edita a mano; registre una remisión (Entrada, Salida o Ajuste)'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_producto_proteger_stock
BEFORE INSERT OR UPDATE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_proteger_stock();

CREATE OR REPLACE FUNCTION fn_revertir_anulacion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT codigo_producto, cantidad
             FROM detalle_movimiento WHERE nro_remision = NEW.nro_remision
    LOOP
        PERFORM fn_aplicar_inventario(NEW.tipo_movimiento, r.codigo_producto, r.cantidad, -1);
    END LOOP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimiento_anulacion
AFTER UPDATE OF estado ON movimiento
FOR EACH ROW
WHEN (OLD.estado <> 'Anulada' AND NEW.estado = 'Anulada')
EXECUTE FUNCTION fn_revertir_anulacion();

CREATE OR REPLACE FUNCTION fn_auditoria()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_old     JSONB;
    v_new     JSONB;
    v_ref     JSONB;
    v_campos  TEXT[];
    v_id      TEXT;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN v_old := to_jsonb(OLD); END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN v_new := to_jsonb(NEW); END IF;

    IF TG_OP = 'UPDATE' THEN
        SELECT array_agg(n.key ORDER BY n.key) INTO v_campos
        FROM jsonb_each(v_new) n
        WHERE n.value IS DISTINCT FROM v_old -> n.key;

        IF v_campos IS NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    v_ref := COALESCE(v_new, v_old);
    SELECT string_agg(v_ref ->> col, '|') INTO v_id
    FROM unnest(TG_ARGV) AS col;

    INSERT INTO auditoria (tabla, operacion, registro_id, datos_anteriores, datos_nuevos,
                           campos_modificados, usuario_bd)
    VALUES (TG_TABLE_NAME, TG_OP, v_id, v_old, v_new, v_campos, session_user);

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_auditoria_ciudad    AFTER INSERT OR UPDATE OR DELETE ON ciudad
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_ciudad');
CREATE TRIGGER trg_auditoria_tercero   AFTER INSERT OR UPDATE OR DELETE ON tercero
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('cedula_tercero');
CREATE TRIGGER trg_auditoria_usuario   AFTER INSERT OR UPDATE OR DELETE ON usuario
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_usuario');
CREATE TRIGGER trg_auditoria_bodega    AFTER INSERT OR UPDATE OR DELETE ON bodega
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_bodega');
CREATE TRIGGER trg_auditoria_categoria AFTER INSERT OR UPDATE OR DELETE ON categoria
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_categoria');
CREATE TRIGGER trg_auditoria_material  AFTER INSERT OR UPDATE OR DELETE ON material
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('id_material');
CREATE TRIGGER trg_auditoria_producto  AFTER INSERT OR UPDATE OR DELETE ON producto
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('codigo');
CREATE TRIGGER trg_auditoria_movimiento AFTER INSERT OR UPDATE OR DELETE ON movimiento
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('nro_remision');
CREATE TRIGGER trg_auditoria_detalle   AFTER INSERT OR UPDATE OR DELETE ON detalle_movimiento
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('nro_remision', 'codigo_producto');
CREATE TRIGGER trg_auditoria_permiso   AFTER INSERT OR UPDATE OR DELETE ON permiso_movimiento
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria('rol', 'tipo_movimiento');

CREATE OR REPLACE FUNCTION fn_bloquear_cambios()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'La tabla % es de solo lectura', TG_TABLE_NAME USING ERRCODE = 'P0001';
END;
$$;

CREATE TRIGGER trg_auditoria_solo_lectura
BEFORE UPDATE OR DELETE ON auditoria
FOR EACH ROW EXECUTE FUNCTION fn_bloquear_cambios();

CREATE OR REPLACE FUNCTION registrar_movimiento(
    p_nro_remision       VARCHAR,
    p_tipo_movimiento    VARCHAR,
    p_id_tercero         BIGINT,
    p_detalles           JSONB,
    p_fecha              DATE    DEFAULT CURRENT_DATE,
    p_id_bodega          INT     DEFAULT 6769,
    p_estado             VARCHAR DEFAULT 'Activa',
    p_id_usuario         INT     DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_id_usuario  INT;
    v_rol         VARCHAR(20);
    v_codigo      TEXT;
    v_mensaje     TEXT;
    v_items       INT;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        v_rol := fn_rol_actual();
        IF v_rol IS NULL THEN
            RAISE EXCEPTION 'Su cuenta no está vinculada a ningún usuario del sistema'
                USING ERRCODE = '42501';
        END IF;
        IF NOT fn_puede_movimiento(p_tipo_movimiento) THEN
            RAISE EXCEPTION 'El rol % no tiene permiso para registrar movimientos de tipo %',
                v_rol, p_tipo_movimiento USING ERRCODE = '42501';
        END IF;
        v_id_usuario := CASE WHEN v_rol = 'Admin' AND p_id_usuario IS NOT NULL
                             THEN p_id_usuario ELSE fn_usuario_actual() END;
    ELSE
        v_id_usuario := p_id_usuario;
        IF v_id_usuario IS NULL THEN
            RAISE EXCEPTION 'Sin login debe indicar p_id_usuario (usuario responsable)'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    IF p_detalles IS NULL OR jsonb_typeof(p_detalles) <> 'array'
       OR jsonb_array_length(p_detalles) = 0 THEN
        RAISE EXCEPTION 'La remisión debe tener al menos un producto' USING ERRCODE = 'P0001';
    END IF;

    IF p_estado = 'Anulada' THEN
        RAISE EXCEPTION 'No se puede crear una remisión ya anulada' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO movimiento (nro_remision, fecha, estado, tipo_movimiento, id_usuario,
                            id_tercero, id_bodega)
    VALUES (p_nro_remision, COALESCE(p_fecha, CURRENT_DATE), COALESCE(p_estado, 'Activa'),
            p_tipo_movimiento, v_id_usuario, p_id_tercero, COALESCE(p_id_bodega, 6769));

    INSERT INTO detalle_movimiento (nro_remision, codigo_producto, cantidad, precio_unitario)
    SELECT p_nro_remision, d.codigo_producto, d.cantidad, d.precio_unitario
    FROM jsonb_to_recordset(p_detalles)
         AS d(codigo_producto VARCHAR(10), cantidad INT, precio_unitario NUMERIC(12,2));

    GET DIAGNOSTICS v_items = ROW_COUNT;

    RETURN jsonb_build_object('ok', true, 'nro_remision', p_nro_remision,
                              'id_usuario', v_id_usuario, 'productos', v_items,
                              'mensaje', 'Remisión registrada correctamente');
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_codigo  = RETURNED_SQLSTATE,
                            v_mensaje = MESSAGE_TEXT;
    RETURN jsonb_build_object('ok', false, 'codigo_error', v_codigo, 'mensaje', v_mensaje);
END;
$$;

CREATE OR REPLACE FUNCTION anular_remision(p_nro_remision VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_estado   VARCHAR(10);
    v_codigo   TEXT;
    v_mensaje  TEXT;
BEGIN
    IF auth.uid() IS NOT NULL AND COALESCE(fn_rol_actual(), '') <> 'Admin' THEN
        RAISE EXCEPTION 'Solo un Admin puede anular remisiones' USING ERRCODE = '42501';
    END IF;

    SELECT estado INTO v_estado FROM movimiento WHERE nro_remision = p_nro_remision;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La remisión % no existe', p_nro_remision USING ERRCODE = 'P0002';
    END IF;

    IF v_estado = 'Anulada' THEN
        RAISE EXCEPTION 'La remisión % ya estaba anulada', p_nro_remision USING ERRCODE = 'P0001';
    END IF;

    UPDATE movimiento SET estado = 'Anulada' WHERE nro_remision = p_nro_remision;

    RETURN jsonb_build_object('ok', true, 'nro_remision', p_nro_remision,
                              'mensaje', 'Remisión anulada y stock revertido');
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_codigo  = RETURNED_SQLSTATE,
                            v_mensaje = MESSAGE_TEXT;
    RETURN jsonb_build_object('ok', false, 'codigo_error', v_codigo, 'mensaje', v_mensaje);
END;
$$;