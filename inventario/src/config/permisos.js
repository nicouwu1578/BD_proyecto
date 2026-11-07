import {
  FiHome,
  FiPackage,
  FiRepeat,
  FiShield,
} from 'react-icons/fi'

// Esto solo oculta opciones en pantalla; la seguridad real la aplica Supabase (RLS)
export const ROLES = ['Admin', 'Ventas', 'Bodega', 'Compras']
const TODOS = ROLES

export const SECCIONES = [
  { ruta: '/', nombre: 'Inicio', icono: FiHome, roles: TODOS },
  { ruta: '/inventario', nombre: 'Inventario', icono: FiPackage, roles: TODOS },
  { ruta: '/transacciones', nombre: 'Transacciones', icono: FiRepeat, roles: TODOS },
  { ruta: '/auditoria', nombre: 'Auditoría', icono: FiShield, roles: ['Admin'] },
]

export function puedeVer(rol, ruta) {
  const seccion = SECCIONES.find((s) => s.ruta === ruta)
  return Boolean(seccion && seccion.roles.includes(rol))
}
