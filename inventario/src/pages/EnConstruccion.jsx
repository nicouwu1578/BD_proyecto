// Página temporal para las secciones que todavía no se han construido
import { FiTool } from 'react-icons/fi'

export default function EnConstruccion({ titulo }) {
  return (
    <section>
      <div className="encabezado-pagina">
        <h1>{titulo}</h1>
      </div>
      <div className="tarjeta vacio">
        <FiTool />
        <p>Esta sección se construye en los próximos módulos.</p>
      </div>
    </section>
  )
}
