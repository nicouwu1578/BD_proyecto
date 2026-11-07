// HashRouter: funciona igual en el navegador y en Electron/Tauri (abren la app desde el disco)
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import Cargando from './components/Cargando'
import Layout from './components/Layout'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Inventario from './pages/Inventario'
import Transacciones from './pages/Transacciones'
import NuevaTransaccion from './pages/NuevaTransaccion'

const Auditoria = lazy(() => import('./pages/Auditoria'))

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Inicio />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/transacciones" element={<Transacciones />} />
            <Route path="/transacciones/nueva" element={<NuevaTransaccion />} />
            <Route path="/auditoria" element={<Suspense fallback={<Cargando />}><Auditoria /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
