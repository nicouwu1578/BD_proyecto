// Campo de búsqueda con lista desplegable de resultados.
// Se usa para elegir el tercero y para agregar productos a la remisión.
import { useMemo, useState } from 'react'
import { FiSearch } from 'react-icons/fi'

export default function Buscador({
  opciones, // lista de objetos
  textoDe, // (opcion) => texto en el que se busca
  render, // (opcion) => cómo se dibuja cada resultado
  claveDe, // (opcion) => clave única
  onElegir, // (opcion) => void
  placeholder,
  maximo = 8,
  vacio = 'Sin resultados',
}) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)

  const resultados = useMemo(() => {
    const t = texto.trim().toLowerCase()
    const lista = t ? opciones.filter((o) => textoDe(o).toLowerCase().includes(t)) : opciones
    return lista.slice(0, maximo)
  }, [opciones, texto, textoDe, maximo])

  function elegir(o) {
    onElegir(o)
    setTexto('')
    setAbierto(false)
  }

  return (
    <div className="buscador">
      <div className="input-con-icono">
        <FiSearch />
        <input
          value={texto}
          placeholder={placeholder}
          onChange={(e) => {
            setTexto(e.target.value)
            setAbierto(true)
          }}
          onFocus={() => setAbierto(true)}
          // pequeño retraso para que alcance a registrar el clic en un resultado
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (resultados[0]) elegir(resultados[0])
            }
          }}
        />
      </div>
      {abierto && (
        <ul className="buscador-lista">
          {resultados.length === 0 && <li className="buscador-vacio">{vacio}</li>}
          {resultados.map((o) => (
            <li key={claveDe(o)}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(o)}>
                {render(o)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
