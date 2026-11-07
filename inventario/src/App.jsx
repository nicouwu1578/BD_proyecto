// Rutas (pantallas) de la aplicación.
// Se usa HashRouter (las URLs quedan como .../#/inventario) porque funciona
// igual en el navegador y dentro de Electron/Tauri, que abren la app desde el disco.
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import Layout from './components/Layout'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Inventario from './pages/Inventario'
import Transacciones from './pages/Transacciones'
import NuevaTransaccion from './pages/NuevaTransaccion'
import EnConstruccion from './pages/EnConstruccion'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<Login />} />

          {/* Privadas: todas pasan por RutaProtegida y usan el Layout con barra lateral */}
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
            <Route path="/reportes" element={<EnConstruccion titulo="Reportes" />} />
            <Route path="/auditoria" element={<EnConstruccion titulo="Auditoría" />} />
            <Route path="/catalogos" element={<EnConstruccion titulo="Catálogos" />} />
          </Route>

          {/* Cualquier otra dirección → Inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
