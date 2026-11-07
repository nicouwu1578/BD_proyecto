// Registrar una remisión: Entrada (compra), Salida (venta), Traslado o Ajuste.
// Al guardar se llama a TU función registrar_movimiento de Supabase, que
// guarda todo junto y actualiza el stock (si algo falla, no se guarda nada).
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

const hoy = () => new Date().toLocaleDateString('en-CA') // AAAA-MM-DD en hora local

export default function NuevaTransaccion() {
  const { rol } = useAuth()
  const navigate = useNavigate()
  const { productos, cargando: cargandoProductos } = useProductos()

  const [permitidos, setPermitidos] = useState(null) // tipos que el rol puede registrar
  const [terceros, setTerceros] = useState([])
  const [bodegas, setBodegas] = useState([])

  const [tipo, setTipo] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [tercero, setTercero] = useState(null)
  const [destino, setDestino] = useState('')
  const [lineas, setLineas] = useState([]) // { producto, cantidad, precio }
  const [mostrarNuevoTercero, setMostrarNuevoTercero] = useState(false)

  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState(null) // { nro_remision, mensaje }

  // Cargar permisos del rol, terceros y bodegas
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

  // Solo los terceros que sirven para el tipo elegido
  const tercerosValidos = useMemo(
    () => (config ? terceros.filter((t) => config.relaciones.includes(t.relacion)) : []),
    [terceros, config],
  )

  // Productos que todavía no están en la remisión
  const productosDisponibles = useMemo(() => {
    const usados = new Set(lineas.map((l) => l.producto.codigo))
    return productos.filter((p) => !usados.has(p.codigo))
  }, [productos, lineas])

  // El cliente mostrador (si ya está creado en la base)
  const clienteMostrador = terceros.find((t) => Number(t.cedula_tercero) === CLIENTE_MOSTRADOR)

  const total = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.precio) || 0), 0)
  const bodegaPrincipal = bodegas.find((b) => b.id_bodega === BODEGA_PRINCIPAL)

  function elegirTipo(t) {
    setTipo(t)
    setError('')
    // si el tercero elegido no sirve para el nuevo tipo, se quita
    if (tercero && !TIPOS[t].relaciones.includes(tercero.relacion)) setTercero(null)
    if (t !== 'Traslado') setDestino('')
  }

  function agregarProducto(p) {
    setLineas([...lineas, { producto: p, cantidad: 1, precio: Number(p.precio_venta) }])
  }

  function cambiarLinea(i, campo, valor) {
    setLineas(lineas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)))
  }

  function quitarLinea(i) {
    setLineas(lineas.filter((_, j) => j !== i))
  }

  function validar() {
    if (!tipo) return 'Elige el tipo de movimiento.'
    if (!tercero) return `Elige el ${config.nombreTercero.toLowerCase()}.`
    if (tipo === 'Traslado' && !destino) return 'Elige la bodega destino del traslado.'
    if (lineas.length === 0) return 'Agrega al menos un producto.'
    for (const l of lineas) {
      if (!(Number.isInteger(Number(l.cantidad)) && Number(l.cantidad) > 0))
        return `La cantidad de ${l.producto.codigo} debe ser un número entero mayor que 0.`
      if (!(Number(l.precio) > 0)) return `El precio de ${l.producto.codigo} debe ser mayor que 0.`
      if (config.restaStock && Number(l.cantidad) > (l.producto.cantidad ?? 0))
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
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio),
    }))

    try {
      // Se intenta hasta 3 veces por si otra persona usó el mismo número al tiempo
      for (let intento = 0; intento < 3; intento++) {
        const nro = await siguienteNroRemision()
        const { data, error: err } = await supabase.rpc('registrar_movimiento', {
          p_nro_remision: nro,
          p_tipo_movimiento: tipo,
          p_id_tercero: tercero.cedula_tercero,
          p_detalles: detalles,
          p_fecha: fecha,
          p_id_bodega: BODEGA_PRINCIPAL,
          p_id_bodega_destino: tipo === 'Traslado' ? Number(destino) : null,
        })
        if (err) throw err
        if (data?.ok) {
          setResultado(data)
          return
        }
        // número repetido -> se reintenta con el siguiente
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
    setDestino('')
    setLineas([])
    setFecha(hoy())
  }

  if (permitidos === null || cargandoProductos) return <Cargando texto="Preparando el formulario..." />

  // Pantalla de éxito
  if (resultado) {
    return (
      <section>
        <div className="tarjeta exito">
          <FiCheckCircle />
          <h1>Remisión {resultado.nro_remision} registrada</h1>
          <p>
            {TIPOS[tipo].titulo} · {resultado.productos} producto(s) · {formatoPesos(total)}
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
          {/* 1. Tipo de movimiento */}
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
              {/* 2. Datos generales */}
              <h2 className="paso">2. Datos de la remisión</h2>
              <div className="tarjeta form-grid">
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
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={() => setMostrarNuevoTercero(true)}
                      >
                        <FiUserPlus /> Nuevo {config.nombreTercero.toLowerCase()}
                      </button>
                    </div>
                  )}
                </div>

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

                {tipo === 'Traslado' && (
                  <label className="campo campo-ancho">
                    <span>Bodega destino</span>
                    <select className="input" value={destino} onChange={(e) => setDestino(e.target.value)}>
                      <option value="">Elige la bodega destino...</option>
                      {bodegas
                        .filter((b) => b.id_bodega !== BODEGA_PRINCIPAL)
                        .map((b) => (
                          <option key={b.id_bodega} value={b.id_bodega}>
                            {b.bodega}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>

              {/* 3. Productos */}
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
                          <th className="derecha">Cantidad</th>
                          <th className="derecha">Precio unitario</th>
                          <th className="derecha">Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.map((l, i) => {
                          const falta = config.restaStock && Number(l.cantidad) > (l.producto.cantidad ?? 0)
                          return (
                            <tr key={l.producto.codigo}>
                              <td>
                                <div className="celda-producto">
                                  <strong>{l.producto.producto}</strong>
                                  <small>{l.producto.codigo}</small>
                                </div>
                              </td>
                              <td className="derecha">{formatoNumero(l.producto.cantidad)}</td>
                              <td className="derecha">
                                <input type="number" min="1" step="1"
                                  className={`input input-numero ${falta ? 'input-error' : ''}`}
                                  value={l.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} />
                              </td>
                              <td className="derecha">
                                <input type="number" min="1" step="any" className="input input-numero"
                                  value={l.precio} onChange={(e) => cambiarLinea(i, 'precio', e.target.value)} />
                              </td>
                              <td className="derecha">
                                <strong>{formatoPesos((Number(l.cantidad) || 0) * (Number(l.precio) || 0))}</strong>
                              </td>
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

                <div className="total-remision">
                  <span>Total</span>
                  <strong>{formatoPesos(total)}</strong>
                </div>
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
