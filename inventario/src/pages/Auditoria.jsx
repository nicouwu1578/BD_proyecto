import { useCallback, useEffect, useState } from 'react'
import { FiRefreshCw, FiX } from 'react-icons/fi'
import { supabase, mensajeError } from '../lib/supabase'
import Cargando from '../components/Cargando'
import Modal from '../components/Modal'

const POR_PAGINA = 100

const TABLAS = {
  movimiento: 'Remisiones',
  detalle_movimiento: 'Detalle de remisión',
  producto: 'Productos',
  tercero: 'Terceros',
  usuario: 'Usuarios',
  bodega: 'Bodegas',
  ciudad: 'Ciudades',
  categoria: 'Categorías',
  material: 'Materiales',
  permiso_movimiento: 'Permisos',
}

const ACCIONES = {
  INSERT: { texto: 'Creación', clase: 'tipo-entrada' },
  UPDATE: { texto: 'Modificación', clase: 'tipo-ajuste' },
  DELETE: { texto: 'Eliminación', clase: 'tipo-salida' },
}

const fechaHora = (f) =>
  new Date(f).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const mostrarValor = (v) => {
  if (v === null || v === undefined) return <span className="texto-suave">vacío</span>
  if (typeof v === 'object') return <code>{JSON.stringify(v)}</code>
  return String(v)
}

function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  useEffect(() => {
    supabase
      .from('usuario')
      .select('id_usuario, usuario, auth_id')
      .order('usuario')
      .then(({ data }) => setUsuarios(data ?? []))
  }, [])
  const nombreDe = useCallback(
    (authId, correo) => {
      if (!authId) return 'Sistema'
      return usuarios.find((u) => u.auth_id === authId)?.usuario ?? correo ?? 'Desconocido'
    },
    [usuarios],
  )
  return { usuarios, nombreDe }
}

function hoyMenos(dias) {
  const d = new Date()
  d.setDate(d.getDate() - dias)
  return d.toLocaleDateString('en-CA')
}

export default function Auditoria() {
  const { usuarios, nombreDe } = useUsuarios()

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Auditoría</h1>
          <p>Historial de cambios en la base de datos.</p>
        </div>
      </div>

      <Historial usuarios={usuarios} nombreDe={nombreDe} />
    </section>
  )
}

function Historial({ usuarios, nombreDe }) {
  const [filas, setFilas] = useState([])
  const [hayMas, setHayMas] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [tabla, setTabla] = useState('')
  const [accion, setAccion] = useState('')
  const [quien, setQuien] = useState('')
  const [desde, setDesde] = useState(hoyMenos(30))
  const [hasta, setHasta] = useState(hoyMenos(0))
  const [registro, setRegistro] = useState('')
  const [abierta, setAbierta] = useState(null)

  const consultar = useCallback(
    async (desdeFila) => {
      let q = supabase
        .from('auditoria')
        .select('*')
        .gte('fecha', `${desde}T00:00:00`)
        .lte('fecha', `${hasta}T23:59:59`)
        .order('fecha', { ascending: false })
        .order('id_auditoria', { ascending: false })
        .range(desdeFila, desdeFila + POR_PAGINA - 1)
      if (tabla) q = q.eq('tabla', tabla)
      if (accion) q = q.eq('operacion', accion)
      if (quien === 'sistema') q = q.is('usuario_app', null)
      else if (quien) q = q.eq('usuario_app', quien)
      if (registro.trim()) q = q.ilike('registro_id', `%${registro.trim()}%`)
      const { data, error: err } = await q
      if (err) throw err
      return data ?? []
    },
    [tabla, accion, quien, desde, hasta, registro],
  )

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await consultar(0)
      setFilas(datos)
      setHayMas(datos.length === POR_PAGINA)
    } catch (e) {
      setError(mensajeError(e))
      setFilas([])
    }
    setCargando(false)
  }, [consultar])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function cargarMas() {
    try {
      const datos = await consultar(filas.length)
      setFilas([...filas, ...datos])
      setHayMas(datos.length === POR_PAGINA)
    } catch (e) {
      setError(mensajeError(e))
    }
  }

  const hayFiltros = tabla || accion || quien || registro

  return (
    <>
      <div className="tarjeta filtros">
        <select value={tabla} onChange={(e) => setTabla(e.target.value)}>
          <option value="">Todas las tablas</option>
          {Object.entries(TABLAS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={accion} onChange={(e) => setAccion(e.target.value)}>
          <option value="">Todas las acciones</option>
          {Object.entries(ACCIONES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.texto}
            </option>
          ))}
        </select>
        <select value={quien} onChange={(e) => setQuien(e.target.value)}>
          <option value="">Todos los usuarios</option>
          {usuarios
            .filter((u) => u.auth_id)
            .map((u) => (
              <option key={u.id_usuario} value={u.auth_id}>
                {u.usuario}
              </option>
            ))}
          <option value="sistema">Sistema</option>
        </select>
        <input
          className="input filtro-registro"
          placeholder="Registro (código, remisión...)"
          value={registro}
          onChange={(e) => setRegistro(e.target.value)}
        />
        <label className="minimo">
          Desde <input type="date" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} />
        </label>
        <label className="minimo">
          Hasta <input type="date" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} />
        </label>
        {hayFiltros && (
          <button
            className="btn btn-secundario btn-chico"
            onClick={() => (setTabla(''), setAccion(''), setQuien(''), setRegistro(''))}
          >
            <FiX /> Limpiar
          </button>
        )}
        <button className="btn btn-secundario btn-chico" onClick={cargar} disabled={cargando}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <Cargando texto="Cargando historial..." />
      ) : (
        <div className="tarjeta sin-relleno">
          <div className="tabla-scroll">
            <table className="tabla tabla-clic">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Tabla</th>
                  <th>Acción</th>
                  <th>Registro</th>
                  <th>Campos modificados</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((a) => (
                  <tr key={a.id_auditoria} onClick={() => setAbierta(a)}>
                    <td className="sin-salto">{fechaHora(a.fecha)}</td>
                    <td>{nombreDe(a.usuario_app, a.email_app)}</td>
                    <td>{TABLAS[a.tabla] ?? a.tabla}</td>
                    <td>
                      <span className={`chip-tipo ${ACCIONES[a.operacion]?.clase ?? ''}`}>
                        {ACCIONES[a.operacion]?.texto ?? a.operacion}
                      </span>
                    </td>
                    <td className="mono">{a.registro_id ?? '—'}</td>
                    <td className="texto-suave">{a.campos_modificados?.join(', ') ?? '—'}</td>
                  </tr>
                ))}
                {filas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="vacio-tabla">
                      No hay cambios registrados con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="paginacion">
            <span>{filas.length} registros</span>
            {hayMas && (
              <button className="btn btn-secundario btn-chico" onClick={cargarMas}>
                Cargar más
              </button>
            )}
          </div>
        </div>
      )}

      {abierta && <DetalleCambio cambio={abierta} nombreDe={nombreDe} onCerrar={() => setAbierta(null)} />}
    </>
  )
}

function DetalleCambio({ cambio: a, nombreDe, onCerrar }) {
  const [todos, setTodos] = useState(a.operacion !== 'UPDATE')
  const antes = a.datos_anteriores ?? {}
  const despues = a.datos_nuevos ?? {}
  const modificados = new Set(a.campos_modificados ?? [])

  const lista = [...new Set([...Object.keys(antes), ...Object.keys(despues)])]
  const campos = todos ? lista : lista.filter((c) => modificados.has(c))

  return (
    <Modal titulo={`${ACCIONES[a.operacion]?.texto ?? a.operacion} en ${TABLAS[a.tabla] ?? a.tabla}`} onCerrar={onCerrar} ancho={760}>
      <dl className="datos">
        <div>
          <dt>Fecha y hora</dt>
          <dd>{fechaHora(a.fecha)}</dd>
        </div>
        <div>
          <dt>Usuario</dt>
          <dd>
            {nombreDe(a.usuario_app, a.email_app)}
            {a.email_app && <small className="texto-suave"> · {a.email_app}</small>}
          </dd>
        </div>
        <div>
          <dt>Registro</dt>
          <dd className="mono">{a.registro_id ?? '—'}</dd>
        </div>
      </dl>

      {a.operacion === 'UPDATE' && (
        <label className="check espacio-abajo">
          <input type="checkbox" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
          Mostrar todos los campos
        </label>
      )}

      <div className="tabla-scroll">
        <table className="tabla tabla-cambios">
          <thead>
            <tr>
              <th>Campo</th>
              {a.operacion !== 'INSERT' && <th>Antes</th>}
              {a.operacion !== 'DELETE' && <th>Después</th>}
            </tr>
          </thead>
          <tbody>
            {campos.map((c) => (
              <tr key={c} className={modificados.has(c) ? 'campo-cambiado' : ''}>
                <td className="mono">{c}</td>
                {a.operacion !== 'INSERT' && <td className="valor-antes">{mostrarValor(antes[c])}</td>}
                {a.operacion !== 'DELETE' && <td className="valor-despues">{mostrarValor(despues[c])}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
