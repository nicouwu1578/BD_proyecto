// Listado de remisiones con filtros, detalle, "marcar realizada" y anular.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiSearch, FiRefreshCw, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { supabase, mensajeError } from '../lib/supabase'
import { formatoFecha, formatoNumero, formatoPesos } from '../lib/formato'
import { ORDEN_TIPOS, PERMITIR_MARCAR_REALIZADA } from '../config/movimientos'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'

// Hay dos llaves foráneas hacia bodega (origen y destino), por eso se nombra
// cada relación con el nombre de su llave foránea.
const COLUMNAS = `
  nro_remision, fecha, estado, tipo_movimiento, id_usuario, id_tercero,
  tercero ( nombre_tercero, relacion ),
  usuario ( usuario ),
  origen:bodega!fk_movimiento_bodega ( bodega ),
  destino:bodega!fk_movimiento_bodega_destino ( bodega ),
  detalle_movimiento ( codigo_producto, cantidad, precio_unitario, producto ( producto ) )
`

const totalDe = (m) =>
  (m.detalle_movimiento ?? []).reduce((s, d) => s + d.cantidad * Number(d.precio_unitario), 0)

export default function Transacciones() {
  const { rol, usuario } = useAuth()
  const [remisiones, setRemisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    const { data, error: err } = await supabase
      .from('movimiento')
      .select(COLUMNAS)
      .order('fecha', { ascending: false })
      .order('nro_remision', { ascending: false })
    if (err) setError(mensajeError(err))
    setRemisiones(data ?? [])
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtradas = useMemo(() => {
    const t = texto.trim().toLowerCase()
    return remisiones.filter((m) => {
      if (t && !`${m.nro_remision} ${m.tercero?.nombre_tercero ?? ''}`.toLowerCase().includes(t)) return false
      if (tipo && m.tipo_movimiento !== tipo) return false
      if (estado && m.estado !== estado) return false
      if (desde && m.fecha < desde) return false
      if (hasta && m.fecha > hasta) return false
      return true
    })
  }, [remisiones, texto, tipo, estado, desde, hasta])

  const hayFiltros = texto || tipo || estado || desde || hasta

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Transacciones</h1>
          <p>{formatoNumero(remisiones.length)} remisiones registradas</p>
        </div>
        <div className="acciones-form">
          <button className="btn btn-secundario" onClick={cargar} disabled={cargando}>
            <FiRefreshCw /> Actualizar
          </button>
          <Link to="/transacciones/nueva" className="btn btn-primario">
            <FiPlus /> Nueva transacción
          </Link>
        </div>
      </div>

      <div className="tarjeta filtros">
        <div className="input-con-icono filtro-busqueda">
          <FiSearch />
          <input type="search" placeholder="Buscar por número o tercero..." value={texto}
            onChange={(e) => setTexto(e.target.value)} />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {ORDEN_TIPOS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Activa</option>
          <option>Realizado</option>
          <option>Anulada</option>
        </select>
        <label className="minimo">
          Desde <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="minimo">
          Hasta <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        {hayFiltros && (
          <button className="btn btn-secundario btn-chico"
            onClick={() => (setTexto(''), setTipo(''), setEstado(''), setDesde(''), setHasta(''))}>
            <FiX /> Limpiar
          </button>
        )}
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <Cargando texto="Cargando remisiones..." />
      ) : (
        <div className="tarjeta sin-relleno">
          <div className="tabla-scroll">
            <table className="tabla tabla-clic">
              <thead>
                <tr>
                  <th>Remisión</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Tercero</th>
                  <th>Responsable</th>
                  <th className="derecha">Productos</th>
                  <th className="derecha">Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((m) => (
                  <tr key={m.nro_remision} onClick={() => setSeleccionada(m)}
                    className={m.estado === 'Anulada' ? 'fila-anulada' : ''}>
                    <td className="mono">{m.nro_remision}</td>
                    <td>{formatoFecha(m.fecha)}</td>
                    <td>
                      <span className={`chip-tipo tipo-${m.tipo_movimiento.toLowerCase()}`}>
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td>{m.tercero?.nombre_tercero ?? '—'}</td>
                    <td>{m.usuario?.usuario ?? '—'}</td>
                    <td className="derecha">{m.detalle_movimiento?.length ?? 0}</td>
                    <td className="derecha">{formatoPesos(totalDe(m))}</td>
                    <td>
                      <span className={`chip-estado estado-${m.estado.toLowerCase()}`}>{m.estado}</span>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan="8" className="vacio-tabla">
                      {remisiones.length === 0
                        ? 'Todavía no hay remisiones. Registra la primera con "Nueva transacción".'
                        : 'No hay remisiones que coincidan con los filtros.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {seleccionada && (
        <DetalleRemision
          remision={seleccionada}
          rol={rol}
          idUsuario={usuario?.id_usuario}
          onCerrar={() => setSeleccionada(null)}
          onCambio={async () => {
            setSeleccionada(null)
            await cargar()
          }}
        />
      )}
    </section>
  )
}

// Ventana con el detalle de una remisión y sus acciones
function DetalleRemision({ remision: m, rol, idUsuario, onCerrar, onCambio }) {
  const [confirmarAnular, setConfirmarAnular] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState('')

  const esAdmin = rol === 'Admin'
  // Tus reglas: solo Admin anula; los demás pueden pasar SU remisión de Activa a Realizado
  const puedeAnular = esAdmin && m.estado !== 'Anulada'
  const puedeRealizar =
    PERMITIR_MARCAR_REALIZADA && m.estado === 'Activa' && (esAdmin || m.id_usuario === idUsuario)

  async function anular() {
    setTrabajando(true)
    setError('')
    const { data, error: err } = await supabase.rpc('anular_remision', { p_nro_remision: m.nro_remision })
    setTrabajando(false)
    if (err) return setError(mensajeError(err))
    if (!data?.ok) return setError(data?.mensaje ?? 'No se pudo anular.')
    onCambio()
  }

  async function marcarRealizada() {
    setTrabajando(true)
    setError('')
    const { error: err } = await supabase
      .from('movimiento')
      .update({ estado: 'Realizado' })
      .eq('nro_remision', m.nro_remision)
    setTrabajando(false)
    if (err) return setError(mensajeError(err))
    onCambio()
  }

  return (
    <Modal titulo={`Remisión ${m.nro_remision}`} onCerrar={onCerrar} ancho={720}>
      <div className="detalle-cabecera">
        <span className={`chip-tipo tipo-${m.tipo_movimiento.toLowerCase()}`}>{m.tipo_movimiento}</span>
        <span className={`chip-estado estado-${m.estado.toLowerCase()}`}>{m.estado}</span>
      </div>
      <dl className="datos">
        <div><dt>Fecha</dt><dd>{formatoFecha(m.fecha)}</dd></div>
        <div><dt>Tercero</dt><dd>{m.tercero?.nombre_tercero ?? '—'} {m.id_tercero ? `(${m.id_tercero})` : ''}</dd></div>
        <div><dt>Responsable</dt><dd>{m.usuario?.usuario ?? '—'}</dd></div>
        <div><dt>Bodega origen</dt><dd>{m.origen?.bodega ?? '—'}</dd></div>
        {m.destino && <div><dt>Bodega destino</dt><dd>{m.destino.bodega}</dd></div>}
      </dl>

      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="derecha">Cantidad</th>
              <th className="derecha">Precio</th>
              <th className="derecha">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(m.detalle_movimiento ?? []).map((d) => (
              <tr key={d.codigo_producto}>
                <td>
                  <div className="celda-producto">
                    <strong>{d.producto?.producto}</strong>
                    <small>{d.codigo_producto}</small>
                  </div>
                </td>
                <td className="derecha">{formatoNumero(d.cantidad)}</td>
                <td className="derecha">{formatoPesos(d.precio_unitario)}</td>
                <td className="derecha">{formatoPesos(d.cantidad * Number(d.precio_unitario))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="total-remision">
        <span>Total</span>
        <strong>{formatoPesos(totalDe(m))}</strong>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {confirmarAnular ? (
        <div className="confirmacion">
          <p>
            ¿Seguro que quieres <strong>anular la remisión {m.nro_remision}</strong>? El inventario de sus
            productos se revierte y la remisión ya no se podrá modificar.
          </p>
          <div className="acciones-form">
            <button className="btn btn-secundario" onClick={() => setConfirmarAnular(false)} disabled={trabajando}>
              No, volver
            </button>
            <button className="btn btn-primario" onClick={anular} disabled={trabajando}>
              {trabajando ? 'Anulando...' : 'Sí, anular'}
            </button>
          </div>
        </div>
      ) : (
        (puedeAnular || puedeRealizar) && (
          <div className="acciones-form">
            {puedeRealizar && (
              <button className="btn btn-secundario" onClick={marcarRealizada} disabled={trabajando}>
                Marcar como realizada
              </button>
            )}
            {puedeAnular && (
              <button className="btn btn-peligro" onClick={() => setConfirmarAnular(true)} disabled={trabajando}>
                Anular remisión
              </button>
            )}
          </div>
        )
      )}
    </Modal>
  )
}
