import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FiSearch,
  FiRefreshCw,
  FiAlertTriangle,
  FiChevronUp,
  FiChevronDown,
  FiX,
} from 'react-icons/fi'
import { useProductos } from '../hooks/useProductos'
import { formatoMedidas, formatoNumero, formatoPesos } from '../lib/formato'
import { guardarStockMinimo, leerStockMinimo } from '../config/inventario'
import Cargando from '../components/Cargando'

const POR_PAGINA = 25
const SIN_GRADO = '__sin_grado__'

const ORDENABLES = {
  codigo: (p) => p.codigo,
  producto: (p) => p.producto,
  categoria: (p) => p.categoria?.categoria ?? '',
  precio: (p) => Number(p.precio_venta),
  stock: (p) => p.cantidad ?? 0,
  valor: (p) => (p.cantidad ?? 0) * Number(p.precio_venta),
}

function Encabezado({ columna, orden, onOrdenar, derecha, children }) {
  const activo = orden.columna === columna
  return (
    <th className={`ordenable ${derecha ? 'derecha' : ''}`} onClick={() => onOrdenar(columna)}>
      {children}
      {activo && (orden.asc ? <FiChevronUp /> : <FiChevronDown />)}
    </th>
  )
}

export default function Inventario() {
  const { productos, cargando, error, recargar } = useProductos()
  const [params] = useSearchParams()

  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [linea, setLinea] = useState('')
  const [material, setMaterial] = useState('')
  const [grado, setGrado] = useState('')
  const [soloBajo, setSoloBajo] = useState(params.get('filtro') === 'bajo')
  const [stockMinimo, setStockMinimo] = useState(leerStockMinimo)
  const [orden, setOrden] = useState({ columna: 'producto', asc: true })
  const [pagina, setPagina] = useState(1)

  const opciones = useMemo(() => {
    const unicos = (fn) => [...new Set(productos.map(fn).filter(Boolean))].sort()
    return {
      categorias: unicos((p) => p.categoria?.categoria),
      materiales: unicos((p) => p.material?.material),
      grados: unicos((p) => p.grado),
      hayNulos: productos.some((p) => !p.grado),
    }
  }, [productos])

  const filtrados = useMemo(() => {
    const busqueda = texto.trim().toLowerCase()
    const lista = productos.filter((p) => {
      if (busqueda && !`${p.codigo} ${p.producto}`.toLowerCase().includes(busqueda)) return false
      if (categoria && p.categoria?.categoria !== categoria) return false
      if (linea && p.categoria?.linea !== linea) return false
      if (material && p.material?.material !== material) return false
      if (grado === SIN_GRADO && p.grado) return false
      if (grado && grado !== SIN_GRADO && p.grado !== grado) return false
      if (soloBajo && (p.cantidad ?? 0) >= stockMinimo) return false
      return true
    })
    const obtener = ORDENABLES[orden.columna]
    return lista.sort((a, b) => {
      const va = obtener(a)
      const vb = obtener(b)
      const r = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return orden.asc ? r : -r
    })
  }, [productos, texto, categoria, linea, material, grado, soloBajo, stockMinimo, orden])

  const totales = useMemo(
    () => ({
      unidades: filtrados.reduce((s, p) => s + (p.cantidad ?? 0), 0),
      valor: filtrados.reduce((s, p) => s + (p.cantidad ?? 0) * Number(p.precio_venta), 0),
      bajos: productos.filter((p) => (p.cantidad ?? 0) < stockMinimo).length,
    }),
    [filtrados, productos, stockMinimo],
  )

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const hayFiltros = texto || categoria || linea || material || grado || soloBajo

  function cambiar(setter) {
    return (e) => {
      setter(e.target.type === 'checkbox' ? e.target.checked : e.target.value)
      setPagina(1)
    }
  }

  function limpiarFiltros() {
    setTexto('')
    setCategoria('')
    setLinea('')
    setMaterial('')
    setGrado('')
    setSoloBajo(false)
    setPagina(1)
  }

  function cambiarMinimo(e) {
    const valor = Math.max(1, Number(e.target.value) || 1)
    setStockMinimo(valor)
    guardarStockMinimo(valor)
    setPagina(1)
  }

  function ordenarPor(columna) {
    setOrden((o) => ({ columna, asc: o.columna === columna ? !o.asc : true }))
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <h1>Inventario</h1>
          <p>
            {formatoNumero(productos.length)} productos · {formatoNumero(totales.unidades)} unidades
            visibles · {formatoPesos(totales.valor)}
          </p>
        </div>
        <button className="btn btn-secundario" onClick={recargar} disabled={cargando}>
          <FiRefreshCw /> Actualizar
        </button>
      </div>

      {totales.bajos > 0 && !soloBajo && (
        <button className="aviso-stock" onClick={() => (setSoloBajo(true), setPagina(1))}>
          <FiAlertTriangle />
          <span>
            <strong>{totales.bajos}</strong> productos tienen menos de{' '}
            {formatoNumero(stockMinimo)} unidades. Ver solo esos.
          </span>
        </button>
      )}

      <div className="tarjeta filtros">
        <div className="input-con-icono filtro-busqueda">
          <FiSearch />
          <input
            type="search"
            placeholder="Buscar por código o nombre..."
            value={texto}
            onChange={cambiar(setTexto)}
          />
        </div>

        <select value={categoria} onChange={cambiar(setCategoria)}>
          <option value="">Todas las categorías</option>
          {opciones.categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select value={linea} onChange={cambiar(setLinea)}>
          <option value="">Todas las líneas</option>
          <option>Automotriz</option>
          <option>Industrial</option>
        </select>

        <select value={material} onChange={cambiar(setMaterial)}>
          <option value="">Todos los materiales</option>
          {opciones.materiales.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <select value={grado} onChange={cambiar(setGrado)}>
          <option value="">Todos los grados</option>
          {opciones.grados.map((g) => (
            <option key={g}>{g}</option>
          ))}
          {opciones.hayNulos && <option value={SIN_GRADO}>Sin grado</option>}
        </select>

        <label className="check">
          <input type="checkbox" checked={soloBajo} onChange={cambiar(setSoloBajo)} />
          Solo stock bajo
        </label>

        <label className="minimo">
          Stock mínimo
          <input type="number" min="1" value={stockMinimo} onChange={cambiarMinimo} />
        </label>

        {hayFiltros && (
          <button className="btn btn-secundario btn-chico" onClick={limpiarFiltros}>
            <FiX /> Limpiar
          </button>
        )}
      </div>

      {error && <div className="alerta alerta-error">{error}</div>}

      {cargando ? (
        <Cargando texto="Cargando productos..." />
      ) : (
        <div className="tarjeta sin-relleno">
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <Encabezado columna="codigo" orden={orden} onOrdenar={ordenarPor}>Código</Encabezado>
                  <Encabezado columna="producto" orden={orden} onOrdenar={ordenarPor}>Producto</Encabezado>
                  <Encabezado columna="categoria" orden={orden} onOrdenar={ordenarPor}>Categoría</Encabezado>
                  <th>Material</th>
                  <th>Grado</th>
                  <Encabezado columna="precio" orden={orden} onOrdenar={ordenarPor} derecha>
                    Precio
                  </Encabezado>
                  <Encabezado columna="stock" orden={orden} onOrdenar={ordenarPor} derecha>
                    Stock
                  </Encabezado>
                  <Encabezado columna="valor" orden={orden} onOrdenar={ordenarPor} derecha>
                    Valor
                  </Encabezado>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => {
                  const bajo = (p.cantidad ?? 0) < stockMinimo
                  return (
                    <tr key={p.codigo} className={bajo ? 'fila-bajo' : ''}>
                      <td className="mono">{p.codigo}</td>
                      <td>
                        <div className="celda-producto">
                          <strong>{p.producto}</strong>
                          <small>{formatoMedidas(p)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="celda-producto">
                          <span>{p.categoria?.categoria}</span>
                          <span className={`chip-linea linea-${p.categoria?.linea?.toLowerCase()}`}>
                            {p.categoria?.linea}
                          </span>
                        </div>
                      </td>
                      <td>{p.material?.material}</td>
                      <td>{p.grado ?? <span className="texto-suave">—</span>}</td>
                      <td className="derecha">{formatoPesos(p.precio_venta)}</td>
                      <td className="derecha">
                        <span
                          className={`stock ${
                            p.cantidad === 0 ? 'stock-cero' : bajo ? 'stock-bajo' : 'stock-ok'
                          }`}
                        >
                          {bajo && <FiAlertTriangle />}
                          {formatoNumero(p.cantidad)}
                        </span>
                      </td>
                      <td className="derecha">
                        {formatoPesos((p.cantidad ?? 0) * Number(p.precio_venta))}
                      </td>
                    </tr>
                  )
                })}
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan="8" className="vacio-tabla">
                      No hay productos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="paginacion">
            <span>
              {filtrados.length === 0
                ? '0 resultados'
                : `${(paginaActual - 1) * POR_PAGINA + 1}–${Math.min(
                    paginaActual * POR_PAGINA,
                    filtrados.length,
                  )} de ${filtrados.length}`}
            </span>
            <div>
              <button
                className="btn btn-secundario btn-chico"
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
              >
                Anterior
              </button>
              <span className="pagina-num">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                className="btn btn-secundario btn-chico"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
