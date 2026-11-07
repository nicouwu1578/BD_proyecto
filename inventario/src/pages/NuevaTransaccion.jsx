import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiCheckCircle,
  FiArrowLeft,
  FiX,
  FiShoppingBag,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useProductos } from '../hooks/useProductos'
import { supabase, mensajeError } from '../lib/supabase'
import { siguienteNroRemision } from '../lib/remision'
import { formatoNumero, formatoPesos } from '../lib/formato'
import { TIPOS, ORDEN_TIPOS, BODEGA_PRINCIPAL, CLIENTE_MOSTRADOR } from '../config/movimientos'
import Buscador from '../components/Buscador'
import NuevoTercero from '../components/NuevoTercero'
import Cargando from '../components/Cargando'

const hoy = () => new Date().toLocaleDateString('en-CA')

export default function NuevaTransaccion() {
  const { rol } = useAuth()
  const navigate = useNavigate()
  const { productos, cargando: cargandoProductos } = useProductos()

  const [permitidos, setPermitidos] = useState(null)
  const [terceros, setTerceros] = useState([])
  const [bodegas, setBodegas] = useState([])

  const [tipo, setTipo] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [tercero, setTercero] = useState(null)
  const [lineas, setLineas] = useState([])
  const [mostrarNuevoTercero, setMostrarNuevoTercero] = useState(false)

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (rol === 'Admin') {
      setPermitidos(ORDEN_TIPOS)
    } else {
      supabase
        .from('permiso_movimiento')
        .select('tipo_movimiento')
        .eq('rol', rol)
        .then(({ data }) => setPermitidos((data ?? []).map((p) => p.tipo_movimiento)))
    }
    supabase
      .from('tercero')
      .select('cedula_tercero, nombre_tercero, relacion, tipo_tercero, ciudad ( ciudad )')
      .order('nombre_tercero')
      .then(({ data }) => setTerceros(data ?? []))
    supabase
      .from('bodega')
      .select('id_bodega, bodega')
      .order('bodega')
      .then(({ data }) => setBodegas(data ?? []))
  }, [rol])

  const config = tipo ? TIPOS[tipo] : null

  const tercerosValidos = useMemo(
    () => (config ? terceros.filter((t) => config.relaciones.includes(t.relacion)) : []),
    [terceros, config],
  )

  const productosDisponibles = useMemo(() => {
    const usados = new Set(lineas.map((l) => l.producto.codigo))
    return productos.filter((p) => !usados.has(p.codigo))
  }, [productos, lineas])

  const clienteMostrador = terceros.find((t) => Number(t.cedula_tercero) === CLIENTE_MOSTRADOR)

  const esAjuste = tipo === 'Ajuste'
  const signo = (l) => (esAjuste && l.sentido === 'Restar' ? -1 : 1)
  const resta = (l) => (config?.restaStock || (esAjuste && l.sentido === 'Restar'))
  const total = lineas.reduce((s, l) => s + signo(l) * (Number(l.cantidad) || 0) * (Number(l.precio) || 0), 0)
  const bodegaPrincipal = bodegas.find((b) => b.id_bodega === BODEGA_PRINCIPAL)

  function elegirTipo(t) {
    setTipo(t)
    setError('')
    if (tercero && !TIPOS[t].relaciones.includes(tercero.relacion)) setTercero(null)
  }

  function agregarProducto(p) {
    setLineas([...lineas, { producto: p, cantidad: 1, precio: Number(p.precio_venta), sentido: 'Sumar' }])
  }

  function cambiarLinea(i, campo, valor) {
    setLineas(lineas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)))
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, j) => j !== i))
  }

  function validar() {
    if (!tipo) return 'Elige el tipo de movimiento.'
    if (config.nombreTercero && !tercero) return `Elige el ${config.nombreTercero.toLowerCase()}.`
    if (lineas.length === 0) return 'Agrega al menos un producto.'
    for (const l of lineas) {
      if (!(Number.isInteger(Number(l.cantidad)) && Number(l.cantidad) > 0))
        return `La cantidad de ${l.producto.codigo} debe ser un número entero mayor que 0.`
      if (!esAjuste && !(Number(l.precio) > 0)) return `El precio de ${l.producto.codigo} debe ser mayor que 0.`
      if (resta(l) && Number(l.cantidad) > (l.producto.cantidad ?? 0))
        return `No hay stock suficiente de ${l.producto.codigo}: hay ${formatoNumero(l.producto.cantidad)}.`
    }
    return ''
  }

  async function guardar() {
    const problema = validar()
    if (problema) return setError(problema)
    setError('')
    setGuardando(true)

    const detalles = lineas.map((l) => ({
      codigo_producto: l.producto.codigo,
      cantidad: signo(l) * Number(l.cantidad),
      precio_unitario: esAjuste ? Number(l.producto.precio_venta) : Number(l.precio),
    }))

    try {
      for (let intento = 0; intento < 3; intento++) {
        const nro = await siguienteNroRemision()
        const { data, error: err } = await supabase.rpc('registrar_movimiento', {
          p_nro_remision: nro,
          p_tipo_movimiento: tipo,
          p_id_tercero: esAjuste ? null : tercero.cedula_tercero,
          p_detalles: detalles,
          p_fecha: fecha,
          p_id_bodega: BODEGA_PRINCIPAL,
        })
        if (err) throw err
        if (data?.ok) {
          setResultado(data)
          return
        }
        if (data?.codigo_error === '23505' && /movimiento_pkey/.test(data?.mensaje ?? '')) continue
        setError(data?.mensaje ?? 'No se pudo registrar la remisión.')
        return
      }
      setError('No se pudo asignar un número de remisión. Intenta de nuevo.')
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  function nuevaRemision() {
    setResultado(null)
    setTipo('')
    setTercero(null)
    setLineas([])
    setFecha(hoy())
  }

  if (permitidos === null || cargandoProductos) return <Cargando texto="Preparando el formulario..." />

  if (resultado) {
    return (
      <section>
        <div className="tarjeta exito">
          <FiCheckCircle />
          <h1>Remisión {resultado.nro_remision} registrada</h1>
          <p>
            {TIPOS[tipo].titulo} · {resultado.productos} producto(s)
            {tipo !== 'Ajuste' && ` · ${formatoPesos(total)}`}
          </p>
          <div className="acciones-form">
            <button className="btn btn-secundario" onClick={() => navigate('/transacciones')}>
              Ver remisiones
            </button>
            <button className="btn btn-primario" onClick={nuevaRemision}>
              <FiPlus /> Nueva remisión
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <Link to="/transacciones" className="enlace">
            <FiArrowLeft /> Remisiones
          </Link>
          <h1>Nueva transacción</h1>
        </div>
      </div>

      {permitidos.length === 0 ? (
        <div className="alerta alerta-error">Tu rol ({rol}) no tiene permiso para registrar movimientos.</div>
      ) : (
        <>
          <h2 className="paso">1. ¿Qué vas a registrar?</h2>
          <div className="selector-tipo">
            {ORDEN_TIPOS.filter((t) => permitidos.includes(t)).map((t) => {
              const { icono: Icono, titulo, subtitulo, clase } = TIPOS[t]
              return (
                <button
                  key={t}
                  type="button"
                  className={`opcion-tipo ${clase} ${tipo === t ? 'elegido' : ''}`}
                  onClick={() => elegirTipo(t)}
                >
                  <Icono />
                  <strong>{titulo}</strong>
                  <span>{subtitulo}</span>
                </button>
              )
            })}
          </div>

          {tipo && (
            <>
              <h2 className="paso">2. Datos de la remisión</h2>
              <div className="tarjeta form-grid">
                {config.nombreTercero && (
                <div className="campo campo-ancho">
                  <span>{config.nombreTercero}</span>
                  {tercero ? (
                    <div className="elegido-chip">
                      <div>
                        <strong>{tercero.nombre_tercero}</strong>
                        <small>
                          {tercero.cedula_tercero} · {tercero.relacion}
                          {tercero.ciudad?.ciudad ? ` · ${tercero.ciudad.ciudad}` : ''}
                        </small>
                      </div>
                      <button type="button" className="btn-icono" onClick={() => setTercero(null)} title="Cambiar">
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <div className="fila-buscador">
                      <Buscador
                        opciones={tercerosValidos}
                        textoDe={(t) => `${t.nombre_tercero} ${t.cedula_tercero}`}
                        claveDe={(t) => t.cedula_tercero}
                        render={(t) => (
                          <>
                            <strong>{t.nombre_tercero}</strong>
                            <small>
                              {t.cedula_tercero} · {t.relacion} · {t.ciudad?.ciudad}
                            </small>
                          </>
                        )}
                        onElegir={setTercero}
                        placeholder={`Buscar ${config.nombreTercero.toLowerCase()} por nombre o documento...`}
                        vacio={`No hay ${config.nombreTercero.toLowerCase()}s con ese nombre`}
                      />
                      {tipo === 'Salida' && clienteMostrador && (
                        <button
                          type="button"
                          className="btn btn-secundario"
                          onClick={() => setTercero(clienteMostrador)}
                          title="Venta a una persona que no se registra (consumidor final)"
                        >
                          <FiShoppingBag /> Cliente mostrador
                        </button>
                      )}
                      {tipo !== 'Ajuste' && (
                        <button
                          type="button"
                          className="btn btn-secundario"
                          onClick={() => setMostrarNuevoTercero(true)}
                        >
                          <FiUserPlus /> Nuevo {config.nombreTercero.toLowerCase()}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                )}

                <label className="campo">
                  <span>Fecha</span>
                  <input type="date" className="input" value={fecha} max={hoy()}
                    onChange={(e) => setFecha(e.target.value)} />
                </label>

                <div className="campo">
                  <span>Bodega de origen</span>
                  <div className="input input-fijo">
                    {bodegaPrincipal?.bodega ?? 'Bodega principal'} ({BODEGA_PRINCIPAL})
                  </div>
                </div>

              </div>

              <h2 className="paso">3. Productos</h2>
              <div className="tarjeta">
                <Buscador
                  opciones={productosDisponibles}
                  textoDe={(p) => `${p.codigo} ${p.producto}`}
                  claveDe={(p) => p.codigo}
                  render={(p) => (
                    <>
                      <strong>{p.producto}</strong>
                      <small>
                        {p.codigo} · stock {formatoNumero(p.cantidad)} · {formatoPesos(p.precio_venta)}
                      </small>
                    </>
                  )}
                  onElegir={agregarProducto}
                  placeholder="Buscar producto por código o nombre para agregarlo..."
                />

                {lineas.length > 0 && (
                  <div className="tabla-scroll lineas">
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="derecha">Stock</th>
                          {esAjuste && <th>Ajuste</th>}
                          <th className="derecha">Cantidad</th>
                          {!esAjuste && <th className="derecha">Precio unitario</th>}
                          {!esAjuste && <th className="derecha">Subtotal</th>}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.map((l, i) => {
                          const falta = resta(l) && Number(l.cantidad) > (l.producto.cantidad ?? 0)
                          return (
                            <tr key={l.producto.codigo}>
                              <td>
                                <div className="celda-producto">
                                  <strong>{l.producto.producto}</strong>
                                  <small>{l.producto.codigo}</small>
                                </div>
                              </td>
                              <td className="derecha">{formatoNumero(l.producto.cantidad)}</td>
                              {esAjuste && (
                                <td>
                                  <select className="input" value={l.sentido}
                                    onChange={(e) => cambiarLinea(i, 'sentido', e.target.value)}>
                                    <option value="Sumar">Sumar</option>
                                    <option value="Restar">Restar</option>
                                  </select>
                                </td>
                              )}
                              <td className="derecha">
                                <input type="number" min="1" step="1"
                                  className={`input input-numero ${falta ? 'input-error' : ''}`}
                                  value={l.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} />
                              </td>
                              {!esAjuste && (
                                <>
                              <td className="derecha">
                                <input type="number" min="1" step="any" className="input input-numero"
                                  value={l.precio} onChange={(e) => cambiarLinea(i, 'precio', e.target.value)} />
                              </td>
                              <td className="derecha">
                                <strong>{formatoPesos(signo(l) * (Number(l.cantidad) || 0) * (Number(l.precio) || 0))}</strong>
                              </td>
                                </>
                              )}
                              <td>
                                <button type="button" className="btn-icono peligro" onClick={() => quitarLinea(i)}
                                  title="Quitar">
                                  <FiTrash2 />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!esAjuste && (
                  <div className="total-remision">
                    <span>Total</span>
                    <strong>{formatoPesos(total)}</strong>
                  </div>
                )}
              </div>

              {error && <div className="alerta alerta-error">{error}</div>}

              <div className="acciones-form">
                <Link to="/transacciones" className="btn btn-secundario">
                  Cancelar
                </Link>
                <button type="button" className={`btn btn-primario`} onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando...' : `Registrar ${config.titulo.toLowerCase()}`}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {mostrarNuevoTercero && (
        <NuevoTercero
          relacionSugerida={config?.nombreTercero === 'Proveedor' ? 'Proveedor' : 'Cliente'}
          onCerrar={() => setMostrarNuevoTercero(false)}
          onCreado={(t) => {
            setTerceros((lista) => [...lista, t])
            if (config.relaciones.includes(t.relacion)) setTercero(t)
            setMostrarNuevoTercero(false)
          }}
        />
      )}
    </section>
  )
}
