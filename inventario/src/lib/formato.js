// Funciones para mostrar números, dinero y fechas en formato colombiano

const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

// 1500 -> "$ 1.500"
export function formatoPesos(valor) {
  return pesos.format(Number(valor) || 0)
}

// 316902 -> "316.902" ; 6.35 -> "6,35"
export function formatoNumero(valor) {
  if (valor === null || valor === undefined) return '—'
  return numero.format(Number(valor))
}

// "2026-11-06" -> "6 nov 2026"
export function formatoFecha(fecha) {
  if (!fecha) return '—'
  // se agrega la hora para que no se corra un día por la zona horaria
  const d = new Date(String(fecha).length === 10 ? fecha + 'T12:00:00' : fecha)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Texto de medidas de un tornillo: "Ø 6,35 × 25,4 mm · paso 1,27"
export function formatoMedidas(p) {
  const base = `Ø ${formatoNumero(p.diametro_mm)} × ${formatoNumero(p.longitud_mm)} mm`
  return p.paso_mm ? `${base} · paso ${formatoNumero(p.paso_mm)}` : base
}
