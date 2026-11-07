const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const numero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

export function formatoPesos(valor) {
  return pesos.format(Number(valor) || 0)
}

export function formatoNumero(valor) {
  if (valor === null || valor === undefined) return '—'
  return numero.format(Number(valor))
}

export function formatoFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(String(fecha).length === 10 ? fecha + 'T12:00:00' : fecha)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatoMedidas(p) {
  const base = `Ø ${formatoNumero(p.diametro_mm)} × ${formatoNumero(p.longitud_mm)} mm`
  return p.paso_mm ? `${base} · paso ${formatoNumero(p.paso_mm)}` : base
}
