// Cliente de Supabase: la ÚNICA conexión a la base de datos de toda la app.
// Cualquier archivo que necesite datos hace:  import { supabase } from '../lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Vite lee estas variables del archivo .env (solo las que empiezan con VITE_)
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si falta alguna, la app muestra un aviso en vez de fallar sin explicación
export const configuracionCompleta = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost', anonKey || 'falta-la-clave', {
  auth: {
    persistSession: true, // la sesión sobrevive al recargar la página
    autoRefreshToken: true, // renueva el token antes de que venza
  },
})

// Traduce los errores más comunes de Supabase a mensajes en español
export function mensajeError(error) {
  if (!error) return ''
  const texto = error.message || String(error)
  if (texto.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (texto.includes('Email not confirmed'))
    return 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada (y la de spam).'
  if (texto.includes('Failed to fetch'))
    return 'No hay conexión con el servidor. Revisa tu internet o la URL de Supabase en el .env.'
  if (texto.includes('Invalid API key')) return 'La clave de Supabase del archivo .env no es válida.'
  return texto
}
