import { supabase } from './supabase'

export const COLOR_VENTAS = '#D7141A'
export const COLOR_COMPRAS = '#2F6FBF'

const TIPOS_VENTA = ['Salida', 'Traslado']

const COLUMNAS = `
  nro_remision, fecha, estado, tipo_movimiento, id_bodega, id_bodega_destino,
  tercero ( cedula_tercero, nombre_tercero, relacion, ciudad ( ciudad, departamento ) ),
  usuario ( usuario ),
  origen:bodega!fk_movimiento_bodega ( bodega ),
  destino:bodega!fk_movimiento_bodega_destino ( bodega ),
  detalle_movimiento ( codigo_producto, cantidad, precio_unitario, producto ( producto ) )
`

export async function cargarRemisiones(desde, hasta) {
  const { data, error } = await supabase
    .from('movimiento')
    .select(COLUMNAS)
    .neq('estado', 'Anulada')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha')
  if (error) throw error
  return data ?? []
}

const valorDe = (m) =>
  (m.detalle_movimiento ?? []).reduce((s, d) => s + d.cantidad * Number(d.precio_unitario), 0)

const unidadesDe = (m) => (m.detalle_movimiento ?? []).reduce((s, d) => s + d.cantidad, 0)

function sumarPor(lista, clave, valor) {
  const mapa = new Map()
  for (const item of lista) {
    const k = clave(item)
    if (k == null) continue
    mapa.set(k, (mapa.get(k) ?? 0) + valor(item))
  }
  return mapa
}

const ordenar = (mapa, nombreClave, nombreValor, limite) =>
  [...mapa.entries()]
    .map(([k, v]) => ({ [nombreClave]: k, [nombreValor]: v }))
    .sort((a, b) => b[nombreValor] - a[nombreValor])
    .slice(0, limite)

function mesesEntre(desde, hasta) {
  const meses = []
  const d = new Date(desde.slice(0, 7) + '-01T12:00:00')
  const fin = new Date(hasta.slice(0, 7) + '-01T12:00:00')
  while (d <= fin) {
    meses.push(d.toISOString().slice(0, 7))
    d.setMonth(d.getMonth() + 1)
  }
  return meses
}

export function nombreMes(clave) {
  const d = new Date(clave + '-01T12:00:00')
  return d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '')
}

export function calcularReportes(remisiones, desde, hasta) {
  const ventas = remisiones.filter((m) => TIPOS_VENTA.includes(m.tipo_movimiento))
  const compras = remisiones.filter((m) => m.tipo_movimiento === 'Entrada')

  const totalVentas = ventas.reduce((s, m) => s + valorDe(m), 0)
  const totalCompras = compras.reduce((s, m) => s + valorDe(m), 0)

  const ventasMes = sumarPor(ventas, (m) => m.fecha.slice(0, 7), valorDe)
  const comprasMes = sumarPor(compras, (m) => m.fecha.slice(0, 7), valorDe)
  const porMes = mesesEntre(desde, hasta).map((mes) => ({
    mes,
    etiqueta: nombreMes(mes),
    ventas: ventasMes.get(mes) ?? 0,
    compras: comprasMes.get(mes) ?? 0,
  }))

  const lineasVenta = ventas.flatMap((m) => m.detalle_movimiento ?? [])
  const unidadesProducto = new Map()
  for (const d of lineasVenta) {
    const actual = unidadesProducto.get(d.codigo_producto) ?? {
      codigo: d.codigo_producto,
      producto: d.producto?.producto ?? d.codigo_producto,
      unidades: 0,
      valor: 0,
    }
    actual.unidades += d.cantidad
    actual.valor += d.cantidad * Number(d.precio_unitario)
    unidadesProducto.set(d.codigo_producto, actual)
  }
  const masVendidos = [...unidadesProducto.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 10)

  const porCliente = ordenar(sumarPor(ventas, (m) => m.tercero?.nombre_tercero, valorDe), 'nombre', 'valor', 10)
  const porCiudad = ordenar(sumarPor(ventas, (m) => m.tercero?.ciudad?.ciudad, valorDe), 'nombre', 'valor', 10)
  const porDepartamento = ordenar(
    sumarPor(ventas, (m) => m.tercero?.ciudad?.departamento, valorDe),
    'nombre',
    'valor',
    10,
  )
  const porProveedor = ordenar(sumarPor(compras, (m) => m.tercero?.nombre_tercero, valorDe), 'nombre', 'valor', 10)

  const bodegas = new Map()
  const fila = (nombre) => {
    if (!bodegas.has(nombre))
      bodegas.set(nombre, { bodega: nombre, entradas: 0, salidas: 0, enviados: 0, recibidos: 0, ajustes: 0, remisiones: 0 })
    return bodegas.get(nombre)
  }
  for (const m of remisiones) {
    const u = unidadesDe(m)
    const origen = fila(m.origen?.bodega ?? `Bodega ${m.id_bodega}`)
    origen.remisiones += 1
    if (m.tipo_movimiento === 'Entrada') origen.entradas += u
    if (m.tipo_movimiento === 'Salida') origen.salidas += u
    if (m.tipo_movimiento === 'Ajuste') origen.ajustes += u
    if (m.tipo_movimiento === 'Traslado') {
      origen.enviados += u
      const destino = fila(m.destino?.bodega ?? `Bodega ${m.id_bodega_destino}`)
      destino.recibidos += u
      destino.remisiones += 1
    }
  }
  const porBodega = [...bodegas.values()].sort((a, b) => b.remisiones - a.remisiones)

  return {
    resumen: {
      totalVentas,
      totalCompras,
      diferencia: totalVentas - totalCompras,
      remisiones: remisiones.length,
      numVentas: ventas.length,
      numCompras: compras.length,
    },
    porMes,
    masVendidos,
    porCliente,
    porCiudad,
    porDepartamento,
    porProveedor,
    porBodega,
  }
}
