--Indices

CREATE INDEX idx_tercero_ciudad         ON tercero (id_ciudad);
CREATE INDEX idx_producto_material      ON producto (id_material);
CREATE INDEX idx_producto_categoria     ON producto (id_categoria);
CREATE INDEX idx_movimiento_usuario     ON movimiento (id_usuario);
CREATE INDEX idx_movimiento_tercero     ON movimiento (id_tercero);
CREATE INDEX idx_movimiento_bodega      ON movimiento (id_bodega);
CREATE INDEX idx_movimiento_fecha       ON movimiento (fecha);
CREATE INDEX idx_detalle_producto       ON detalle_movimiento (codigo_producto);
CREATE INDEX idx_auditoria_tabla_fecha  ON auditoria (tabla, fecha DESC);