import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FiDownload, FiFileText, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiRepeat, FiDollarSign } from 'react-icons/fi'
import { calcularReportes, cargarRemisiones, COLOR_COMPRAS, COLOR_VENTAS } from '../lib/reportes'
import { exportarExcel, exportarPdf } from '../lib/exportar'
import { mensajeError } from '../lib/supabase'
import { formatoNumero, formatoPesos } from '../lib/formato'
import Cargando from '../components/Cargando'

const fechaLocal = (d) => d.toLocaleDateString('en-CA')

function rango(meses) {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1)
  return { desde: fechaLocal(inicio), hasta: fechaLocal(hoy) }
}

const PRESETS = [
  { etiqueta: 'Este mes', ...rango(1) },
  { etiqueta: '3 meses', ...rango(3) },
  { etiqueta: '6 meses', ...rango(6) },
  { etiqueta: 'Este año', desde: `${new Date().getFullYear()}-01-01`, hasta: fechaLocal(new Date()) },
]

function pesosCortos(v) {
  const n = Math.abs(v)
  const signo = v < 0 ? '-' : ''
  if (n >= 1_000_000) return `${signo}$${formatoNumero(Math.round(n / 100_000) / 10)} M`
  if (n >= 1_000) return `${signo}$${formatoNumero(Math.round(n / 1_000))} mil`
  return `${signo}$${formatoNumero(n)}`
}

const EJE = { fontSize: 12, fill: '#6b6e73' }
const GRID = '#e8e9ec'

function Tarjeta({ titulo, subtitulo, children, tabla, mostrarTabla, onAlternar, extra }) {
  return (
    <div className="tarjeta reporte">
      <div className="tarjeta-titulo">
        <div>
          <h2>{titulo}</h2>
          {subtitulo && <small className="texto-suave">{subtitulo}</small>}
        </div>
        <div className="acciones-reporte">
          {extra}
          {tabla && (
            <button className="btn btn-secundario btn-chico" onClick={onAlternar}>
              {mostrarTabla ? 'Ver gráfica' : 'Ver tabla'}
            </button>
          )}
        </div>
      </div>
      {mostrarTabla ? tabla : children}
    </div>
  )
}

function TablaSimple({ columnas, filas }) {
  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            {columnas.map((c, i) => (
              <th key={c} className={i > 0 ? 'derecha' : ''}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {f.map((v, j) => (
                <td key={j} className={j > 0 ? 'derecha' : ''}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
          {filas.length === 0 && (
            <tr>
              <td colSpan={columnas.length} className="vacio-tabla">
                Sin datos en este período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TooltipPesos({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-grafica">
      <strong>{label}</strong>
      {payload.map((p) => (
        <div key={p.dataKey} className="tooltip-fila">
          <span className="tooltip-marca" style={{ background: p.color }} />
          <span>{p.name}</span>
          <b>{formatoPesos(p.value)}</b>
        </div>
      ))}
    </div>
  )
}

function TooltipProducto({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="tooltip-grafica">
      <strong>{p.producto}</strong>
      <div className="tooltip-fila">
        <span>Código</span>
        <b>{p.codigo}</b>
      </div>
      <div className="tooltip-fila">
        <span>Unidades</span>
        <b>{formatoNumero(p.unidades)}</b>
      </div>
      <div className="tooltip-fila">
        <span>Valor</span>
        <b>{formatoPesos(p.valor)}</b>
      </div>
    </div>
  )
}

function EtiquetaEje({ x, y, payload, largo = 25 }) {
  const texto = String(payload.value)
  const corto = texto.length > largo ? texto.slice(0, largo - 1) + '…' : texto
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#2b2d31">
      <title>{texto}</title>
      {corto}
    </text>
  )
}

function Leyenda({ items }) {
  return (
    <div className="leyenda">
      {items.map((i) => (
        <span key={i.nombre}>
          <span className="tooltip-marca" style={{ background: i.color }} />
          {i.nombre}
        </span>
      ))}
    </div>
  )
}

function BarrasHorizontales({ datos, clave, nombre, color, valor = 'valor', formato = pesosCortos, tooltip }) {
  const alto = Math.max(160, datos.length * 34 + 30)
  if (datos.length === 0) return <p className="texto-suave vacio-grafica">Sin datos en este período.</p>
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap={6}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={EJE} tickFormatter={formato} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey={clave}
          width={200}
          tick={<EtiquetaEje />}
          interval={0}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={tooltip ?? <TooltipPesos />} />
        <Bar
          dataKey={valor}
          name={nombre}
          fill={color}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          label={{ position: 'right', formatter: formato, fontSize: 11, fill: '#4a4d52' }}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function Reportes() {
  const [desde, setDesde] = useState(PRESETS[2].desde)
  const [hasta, setHasta] = useState(PRESETS[2].hasta)
  const [remisiones, setRemisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exportando, setExportando] = useState('')
  const [agrupar, setAgrupar] = useState('cliente')
  const [tablas, setTablas] = useState({})

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setRemisiones(await cargarRemisiones(desde, hasta))
    } catch (e) {
      setError(mensajeError(e))
      setRemisiones([])
    }
    setCargando(false)
  }, [desde, hasta])

  useEffect(() => {
    cargar()
  }, [cargar])

  const r = useMemo(() => calcularReportes(remisiones, desde, hasta), [remisiones, desde, hasta])

  const alternar = (k) => () => setTablas((t) => ({ ...t, [k]: !t[k] }))

  async function exportar(tipo) {
    setExportando(tipo)
    try {
      if (tipo === 'excel') await exportarExcel(r, desde, hasta)
      else await exportarPdf(r, desde, hasta)
    } catch (e) {
      setError('No se pudo exportar: ' + mensajeError(e))
    }
    setExportando('')
  }

  const ventasAgrupadas = { cliente: r.porCliente, ciudad: r.porCiudad, departamento: r.porDepartamento }[agrupar]

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Reportes</h1>
          <p>Las ventas incluyen salidas y traslados. No se cuentan las remisiones anuladas.</p>
        </div>
        <div className="acciones-form">
          <button className="btn btn-secundario" onClick={() => exportar('excel')} disabled={cargando || !!exportando}>
            <FiDownload /> {exportando === 'excel' ? 'Generando...' : 'Excel'}
          </button>
          <button className="btn btn-primario" onClick={() => exportar('pdf')} disabled={cargando || !!exportando}>
            <FiFileText /> {exportando === 'pdf' ? 'Generando...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="tarjeta filtros">
        <div className="segmentado">
          {PRESETS.map((p) => (
            <button
              key={p.etiqueta}
              className={desde === p.desde && hasta === p.hasta ? 'activo' : ''}
              onClick={() => (setDesde(p.desde), setHasta(p.hasta))}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
        <label className="minimo">
          Desde <input type="date" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} />
        </label>
        <label className="minimo">
          Hasta <input type="date" value={hasta} min={desde} onChange={(e) => e.target.value && setHasta(e.target.value)} />
        </label>
        <button className="btn btn-secundario btn-chico" onClick={cargar} disabled={cargando}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <Cargando texto="Calculando reportes..." />
      ) : (
        <>
          <div className="kpis">
            <div className="kpi kpi-ventas">
              <FiTrendingUp />
              <div>
                <span>Ventas</span>
                <strong>{formatoPesos(r.resumen.totalVentas)}</strong>
                <small>{formatoNumero(r.resumen.numVentas)} remisiones</small>
              </div>
            </div>
            <div className="kpi kpi-compras">
              <FiTrendingDown />
              <div>
                <span>Compras</span>
                <strong>{formatoPesos(r.resumen.totalCompras)}</strong>
                <small>{formatoNumero(r.resumen.numCompras)} remisiones</small>
              </div>
            </div>
            <div className="kpi">
              <FiDollarSign />
              <div>
                <span>Diferencia</span>
                <strong className={r.resumen.diferencia < 0 ? 'negativo' : ''}>{formatoPesos(r.resumen.diferencia)}</strong>
                <small>ventas − compras (margen aproximado)</small>
              </div>
            </div>
            <div className="kpi">
              <FiRepeat />
              <div>
                <span>Remisiones</span>
                <strong>{formatoNumero(r.resumen.remisiones)}</strong>
                <small>en el período</small>
              </div>
            </div>
          </div>

          <Tarjeta
            titulo="Ventas y compras por mes"
            mostrarTabla={tablas.mes}
            onAlternar={alternar('mes')}
            tabla={
              <TablaSimple
                columnas={['Mes', 'Ventas', 'Compras', 'Diferencia']}
                filas={r.porMes.map((m) => [m.etiqueta, formatoPesos(m.ventas), formatoPesos(m.compras), formatoPesos(m.ventas - m.compras)])}
              />
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={r.porMes} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="etiqueta" tick={EJE} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={EJE} tickFormatter={pesosCortos} axisLine={false} tickLine={false} width={80} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<TooltipPesos />} />
                <Bar dataKey="ventas" name="Ventas" fill={COLOR_VENTAS} radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="compras" name="Compras" fill={COLOR_COMPRAS} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
            <Leyenda
              items={[
                { nombre: 'Ventas', color: COLOR_VENTAS },
                { nombre: 'Compras', color: COLOR_COMPRAS },
              ]}
            />
          </Tarjeta>

          <div className="dos-columnas">
            <Tarjeta
              titulo="Productos más vendidos"
              subtitulo="Top 10 por unidades"
              mostrarTabla={tablas.productos}
              onAlternar={alternar('productos')}
              tabla={
                <TablaSimple
                  columnas={['Código', 'Producto', 'Unidades', 'Valor']}
                  filas={r.masVendidos.map((p) => [p.codigo, p.producto, formatoNumero(p.unidades), formatoPesos(p.valor)])}
                />
              }
            >
              <BarrasHorizontales
                datos={r.masVendidos}
                clave="codigo"
                valor="unidades"
                nombre="Unidades"
                color={COLOR_VENTAS}
                formato={(v) => formatoNumero(v)}
                tooltip={<TooltipProducto />}
              />
            </Tarjeta>

            <Tarjeta
              titulo="Ventas por"
              subtitulo="Top 10"
              mostrarTabla={tablas.ventas}
              onAlternar={alternar('ventas')}
              extra={
                <div className="segmentado segmentado-chico">
                  {['cliente', 'ciudad', 'departamento'].map((k) => (
                    <button key={k} className={agrupar === k ? 'activo' : ''} onClick={() => setAgrupar(k)}>
                      {k[0].toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>
              }
              tabla={
                <TablaSimple
                  columnas={[agrupar[0].toUpperCase() + agrupar.slice(1), 'Ventas']}
                  filas={ventasAgrupadas.map((x) => [x.nombre, formatoPesos(x.valor)])}
                />
              }
            >
              <BarrasHorizontales datos={ventasAgrupadas} clave="nombre" nombre="Ventas" color={COLOR_VENTAS} />
            </Tarjeta>
          </div>

          <Tarjeta
              titulo="Compras por proveedor"
              subtitulo="Top 10"
              mostrarTabla={tablas.proveedores}
              onAlternar={alternar('proveedores')}
              tabla={
                <TablaSimple
                  columnas={['Proveedor', 'Compras']}
                  filas={r.porProveedor.map((x) => [x.nombre, formatoPesos(x.valor)])}
                />
              }
            >
              <BarrasHorizontales datos={r.porProveedor} clave="nombre" nombre="Compras" color={COLOR_COMPRAS} />
            </Tarjeta>

            <Tarjeta titulo="Movimientos por bodega" subtitulo="Unidades por tipo de movimiento">
              <TablaSimple
                columnas={['Bodega', 'Entradas', 'Salidas', 'Enviados', 'Recibidos', 'Ajustes', 'Remisiones']}
                filas={r.porBodega.map((b) => [
                  b.bodega,
                  formatoNumero(b.entradas),
                  formatoNumero(b.salidas),
                  formatoNumero(b.enviados),
                  formatoNumero(b.recibidos),
                  formatoNumero(b.ajustes),
                  formatoNumero(b.remisiones),
                ])}
              />
            </Tarjeta>
        </>
      )}
    </section>
  )
}
