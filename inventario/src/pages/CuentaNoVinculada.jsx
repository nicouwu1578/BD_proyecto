import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

export default function CuentaNoVinculada() {
  const { correo, session, cerrarSesion } = useAuth()

  return (
    <div className="login-pagina">
      <div className="login-tarjeta">
        <img src={logo} alt="Multitornillos" className="login-logo" />
        <h1>Cuenta sin acceso</h1>
        <p>
          Iniciaste sesión como <strong>{correo}</strong>, pero tu cuenta todavía no está
          asignada a ningún usuario del sistema.
        </p>
        <p>Pídele al administrador que te asigne un usuario y un rol. Debe usar este código:</p>
        <code className="codigo-copiable">{session?.user?.id}</code>
        <button className="btn btn-secundario btn-bloque" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
