// Envuelve las páginas que necesitan sesión iniciada.
// - Sin sesión → manda al Login.
// - Con sesión pero sin usuario vinculado en la tabla "usuario" → aviso.
// - Con un rol que no puede ver la sección → manda al Inicio.
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { puedeVer } from '../config/permisos'
import Cargando from './Cargando'
import CuentaNoVinculada from '../pages/CuentaNoVinculada'

export default function RutaProtegida({ children }) {
  const { session, usuario, rol, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <Cargando texto="Verificando sesión..." />
  if (!session) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!usuario) return <CuentaNoVinculada />

  // Las subrutas (/catalogos/productos) heredan el permiso de su sección (/catalogos)
  const seccion = '/' + (location.pathname.split('/')[1] || '')
  if (!puedeVer(rol, seccion)) return <Navigate to="/" replace />

  return children
}
