// Página de inicio de sesión (correo y contraseña con Supabase Auth)
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { configuracionCompleta, mensajeError } from '../lib/supabase'
import logo from '../assets/logo.png'

export default function Login() {
  const { session, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Si ya hay sesión, no tiene sentido ver el login
  if (session) return <Navigate to="/" replace />

  async function manejarEnvio(e) {
    e.preventDefault() // evita que el formulario recargue la página
    setError('')
    setEnviando(true)
    const err = await iniciarSesion(correo, contrasena)
    setEnviando(false)
    if (err) {
      setError(mensajeError(err))
      return
    }
    // vuelve a la página que intentaba abrir, o al Inicio
    navigate(location.state?.desde || '/', { replace: true })
  }

  return (
    <div className="login-pagina">
      <form className="login-tarjeta" onSubmit={manejarEnvio}>
        <img src={logo} alt="Multitornillos" className="login-logo" />
        <h1>Multitornillos</h1>
        <p className="login-subtitulo">Sistema de inventario</p>

        {!configuracionCompleta && (
          <div className="alerta alerta-error">
            Falta configurar Supabase: abre el archivo <code>.env</code>, pega tu clave en
            <code> VITE_SUPABASE_ANON_KEY</code> y reinicia <code>npm run dev</code>.
          </div>
        )}

        <label className="campo">
          <span>Correo</span>
          <div className="input-con-icono">
            <FiMail />
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@empresa.com"
              autoComplete="email"
              required
            />
          </div>
        </label>

        <label className="campo">
          <span>Contraseña</span>
          <div className="input-con-icono">
            <FiLock />
            <input
              type={verContrasena ? 'text' : 'password'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="btn-icono"
              onClick={() => setVerContrasena(!verContrasena)}
              aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verContrasena ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        {error && <div className="alerta alerta-error">{error}</div>}

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="login-ayuda">
          ¿No tienes cuenta? Pídele al administrador que te registre.
        </p>
      </form>
    </div>
  )
}
