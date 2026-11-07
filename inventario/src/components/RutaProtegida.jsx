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

  const seccion = '/' + (location.pathname.split('/')[1] || '')
  if (!puedeVer(rol, seccion)) return <Navigate to="/" replace />

  return children
}
