// Ventana emergente reutilizable (se cierra con la X, con Escape o clic afuera)
import { useEffect } from 'react'
import { FiX } from 'react-icons/fi'

export default function Modal({ titulo, onCerrar, children, ancho = 560 }) {
  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" style={{ maxWidth: ancho }} role="dialog" aria-modal="true">
        <div className="modal-cabecera">
          <h2>{titulo}</h2>
          <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar">
            <FiX />
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  )
}
