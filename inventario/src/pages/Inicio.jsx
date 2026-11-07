import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiPackage,
  FiRepeat,
  FiDollarSign,
  FiLayers,
  FiAlertTriangle,
  FiArrowRight,
} from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useProductos } from '../hooks/useProductos'
import { supabase, mensajeError } from '../lib/supabase'
import { formatoFecha, formatoNumero, formatoPesos } from '../lib/formato'
import { leerStockMinimo } from '../config/inventario'
import Cargando from '../components/Cargando'

export default function Inicio() {
  const { usuario, rol } = useAuth()
  const { productos, cargando, error } = useProductos()
  const [stockMinimo] = useState(leerStockMinimo)

  const [ultimas, setUltimas] = useState([])
  const [errorMov, setErrorMov] = useState('')
  useEffect(() => {
    supabase
      .from('movimiento')
      .select('nro_remision, fecha, estado, tipo_movimiento, tercero ( nombre_tercero )')
      .order('fecha', { ascending: false })
      .order('nro_remision', { ascending: false })
      .limit(5)
      .then(({ data, error: err }) => {
        if (err) setErrorMov(mensajeError(err))
        else setUltimas(data ?? [])
      })
  }, [])

  const resumen = useMemo(() => {
    const unidades = productos.reduce((s, p) => s + (p.cantidad || 0), 0)
    const valor = productos.reduce((s, p) => s + (p.cantidad || 0) * Number(p.precio_venta), 0)
    const bajos = productos
      .filter((p) => (p.cantidad || 0) < stockMinimo)
      .sort((a, b) => a.cantidad - b.cantidad)
    return { unidades, valor, bajos }
  }, [productos, stockMinimo])

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Hola, {usuario?.usuario}</h1>
          <p>
            Rol: <strong>{rol}</strong> · Resumen del inventario
          </p>
        </div>
      </div>

      <div className="accesos">
        <Link to="/inventario" className="acceso">
          <FiPackage />
          <span>Ver inventario</span>
        </Link>
        <Link to="/transacciones" className="acceso acceso-rojo">
          <FiRepeat />
          <span>Hacer transacción</span>
        </Link>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <Cargando texto="Cargando resumen..." />
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <FiDollarSign />
              <div>
                <span>Valor del inventario</span>
                <strong>{formatoPesos(resumen.valor)}</strong>
                <small>a precio de venta</small>
              </div>
            </div>
            <div className="kpi">
              <FiLayers />
              <div>
                <span>Unidades en stock</span>
                <strong>{formatoNumero(resumen.unidades)}</strong>
                <small>{productos.length} productos</small>
              </div>
            </div>
            <Link to="/inventario?filtro=bajo" className="kpi kpi-alerta">
              <FiAlertTriangle />
              <div>
                <span>Stock bajo</span>
                <strong>{resumen.bajos.length}</strong>
                <small>menos de {formatoNumero(stockMinimo)} unidades</small>
              </div>
            </Link>
          </div>

          <div className="dos-columnas">
            <div className="tarjeta">
              <div className="tarjeta-titulo">
                <h2>Productos con stock bajo</h2>
                <Link to="/inventario?filtro=bajo" className="enlace">
                  Ver todos <FiArrowRight />
                </Link>
              </div>
              {resumen.bajos.length === 0 ? (
                <p className="texto-suave">Ningún producto está por debajo del mínimo. 👍</p>
              ) : (
                <ul className="lista-simple">
                  {resumen.bajos.slice(0, 6).map((p) => (
                    <li key={p.codigo}>
                      <div>
                        <strong>{p.producto}</strong>
                        <small>{p.codigo}</small>
                      </div>
                      <span className={`stock ${p.cantidad === 0 ? 'stock-cero' : 'stock-bajo'}`}>
                        {formatoNumero(p.cantidad)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="tarjeta">
              <div className="tarjeta-titulo">
                <h2>Últimas transacciones</h2>
                <Link to="/transacciones" className="enlace">
                  Ver todas <FiArrowRight />
                </Link>
              </div>
              {errorMov && <div className="alerta alerta-error">{errorMov}</div>}
              {!errorMov && ultimas.length === 0 ? (
                <p className="texto-suave">Todavía no hay remisiones registradas.</p>
              ) : (
                <ul className="lista-simple">
                  {ultimas.map((m) => (
                    <li key={m.nro_remision}>
                      <div>
                        <strong>
                          {m.nro_remision} · {m.tercero?.nombre_tercero ?? 'Sin tercero'}
                        </strong>
                        <small>{formatoFecha(m.fecha)}</small>
                      </div>
                      <span className={`chip-tipo tipo-${m.tipo_movimiento.toLowerCase()}`}>
                        {m.tipo_movimiento}
                        {m.estado === 'Anulada' ? ' · Anulada' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
