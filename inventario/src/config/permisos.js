
import {
  FiHome,
  FiPackage,
  FiRepeat,
  FiBarChart2,
  FiShield,
  FiDatabase,
} from 'react-icons/fi'

export const ROLES = ['Admin', 'Ventas', 'Bodega', 'Compras']
const TODOS = ROLES

export const SECCIONES = [
  { ruta: '/', nombre: 'Inicio', icono: FiHome, roles: TODOS },
  { ruta: '/inventario', nombre: 'Inventario', icono: FiPackage, roles: TODOS },
  { ruta: '/transacciones', nombre: 'Transacciones', icono: FiRepeat, roles: TODOS },
  { ruta: '/reportes', nombre: 'Reportes', icono: FiBarChart2, roles: ['Admin'] },
  { ruta: '/auditoria', nombre: 'Auditoría', icono: FiShield, roles: ['Admin'] },
  { ruta: '/catalogos', nombre: 'Catálogos', icono: FiDatabase, roles: ['Admin'] },
]

// ¿Este rol puede entrar a esta sección?
export function puedeVer(rol, ruta) {
  const seccion = SECCIONES.find((s) => s.ruta === ruta)
  return Boolean(seccion && seccion.roles.includes(rol))
}
