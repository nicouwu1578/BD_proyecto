import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { SECCIONES } from '../config/permisos'
import logo from '../assets/logo.png'

export default function Layout() {
  const { usuario, rol, correo, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const secciones = SECCIONES.filter((s) => s.roles.includes(rol))

  return (
    <div className="layout">
      <header className="topbar">
        <button className="btn-icono" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <FiMenu />
        </button>
        <img src={logo} alt="Multitornillos" className="topbar-logo" />
        <span className="topbar-titulo">Multitornillos</span>
      </header>

      {menuAbierto && <div className="sidebar-fondo" onClick={() => setMenuAbierto(false)} />}

      <aside className={`sidebar ${menuAbierto ? 'abierta' : ''}`}>
        <div className="sidebar-marca">
          <img src={logo} alt="Multitornillos" />
          <div>
            <strong>Multitornillos</strong>
            <span>Inventario</span>
          </div>
          <button
            className="btn-icono sidebar-cerrar"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {secciones.map(({ ruta, nombre, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'activo' : ''}`}
              onClick={() => setMenuAbierto(false)}
            >
              <Icono />
              <span>{nombre}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-usuario">
          <div className="avatar">{usuario?.usuario?.charAt(0)?.toUpperCase()}</div>
          <div className="sidebar-usuario-datos">
            <strong>{usuario?.usuario}</strong>
            <span className={`etiqueta-rol rol-${rol?.toLowerCase()}`}>{rol}</span>
            <small title={correo}>{correo}</small>
          </div>
          <button className="btn-icono" onClick={cerrarSesion} title="Cerrar sesión">
            <FiLogOut />
          </button>
        </div>
      </aside>

      <main className="contenido">
        <Outlet />
      </main>
    </div>
  )
}
