import { useCallback, useEffect, useState } from 'react'
import { supabase, mensajeError } from '../lib/supabase'

const COLUMNAS = `
  codigo, producto, diametro_mm, paso_mm, longitud_mm, grado,
  precio_venta, cantidad,
  categoria ( id_categoria, categoria, linea ),
  material ( id_material, material )
`

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    setError('')
    const { data, error: err } = await supabase
      .from('producto')
      .select(COLUMNAS)
      .order('producto')
    if (err) {
      setError(mensajeError(err))
      setProductos([])
    } else {
      setProductos(data ?? [])
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { productos, cargando, error, recargar }
}
