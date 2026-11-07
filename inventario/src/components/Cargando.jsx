export default function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="cargando">
      <div className="spinner" />
      <p>{texto}</p>
    </div>
  )
}
