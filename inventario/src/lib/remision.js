// Número de remisión: tu base no lo genera sola, así que la app calcula el
// siguiente a partir del último que empieza con "R" (R0000001, R0000002, ...).
import { supabase } from './supabase'

export async function siguienteNroRemision() {
  const { data, error } = await supabase
    .from('movimiento')
    .select('nro_remision')
    .like('nro_remision', 'R%')
    .order('nro_remision', { ascending: false })
    .limit(1)
  if (error) throw error
  const ultimo = data?.[0]?.nro_remision ?? 'R0000000'
  const numero = parseInt(ultimo.slice(1), 10) || 0
  return 'R' + String(numero + 1).padStart(7, '0')
}
