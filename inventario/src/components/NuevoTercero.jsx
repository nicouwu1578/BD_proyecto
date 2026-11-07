import { useEffect, useState } from 'react'
import Modal from './Modal'
import { supabase, mensajeError } from '../lib/supabase'
import { TIPOS_TERCERO } from '../config/movimientos'

export default function NuevoTercero({ relacionSugerida = 'Cliente', onCreado, onCerrar }) {
  const [ciudades, setCiudades] = useState([])
  const [form, setForm] = useState({
    cedula_tercero: '',
    nombre_tercero: '',
    relacion: relacionSugerida,
    tipo_tercero: relacionSugerida === 'Proveedor' ? '' : 'Persona',
    id_ciudad: '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    supabase
      .from('ciudad')
      .select('id_ciudad, ciudad, departamento')
      .order('ciudad')
      .then(({ data }) => setCiudades(data ?? []))
  }, [])

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  async function guardar(e) {
    e.preventDefault()
    setError('')

    const documento = form.cedula_tercero.replace(/\D/g, '')
    if (!documento || Number(documento) <= 0) return setError('Escribe un documento válido (solo números).')
    if (!form.nombre_tercero.trim()) return setError('Escribe el nombre.')
    if (!form.id_ciudad) return setError('Elige la ciudad.')
    if (form.relacion !== 'Proveedor' && !form.tipo_tercero)
      return setError('Los clientes deben tener un tipo (Taller, Distribuidor, Persona u Otros).')

    setGuardando(true)
    const nuevo = {
      cedula_tercero: Number(documento),
      nombre_tercero: form.nombre_tercero.trim(),
      relacion: form.relacion,
      tipo_tercero: form.tipo_tercero || null,
      id_ciudad: Number(form.id_ciudad),
    }
    const { data, error: err } = await supabase
      .from('tercero')
      .insert(nuevo)
      .select('cedula_tercero, nombre_tercero, relacion, tipo_tercero, ciudad ( ciudad )')
      .single()
    setGuardando(false)

    if (err) {
      if (err.code === '23505') return setError('Ya existe un tercero con ese documento.')
      if (err.code === '42501')
        return setError(
          'Tu rol no puede crear este tipo de tercero (Ventas crea clientes, Compras crea proveedores).',
        )
      return setError(mensajeError(err))
    }
    onCreado(data)
  }

  return (
    <Modal titulo="Nuevo cliente / proveedor" onCerrar={onCerrar}>
      <form onSubmit={guardar} className="form-grid">
        <label className="campo">
          <span>Documento (NIT o cédula)</span>
          <input className="input" inputMode="numeric" value={form.cedula_tercero}
            onChange={cambiar('cedula_tercero')} placeholder="900123456" autoFocus />
        </label>
        <label className="campo">
          <span>Nombre o razón social</span>
          <input className="input" value={form.nombre_tercero} onChange={cambiar('nombre_tercero')}
            maxLength={100} placeholder="Taller El Ejemplo S.A.S." />
        </label>
        <label className="campo">
          <span>Relación</span>
          <select className="input" value={form.relacion} onChange={cambiar('relacion')}>
            <option>Cliente</option>
            <option>Proveedor</option>
            <option>Ambos</option>
          </select>
        </label>
        <label className="campo">
          <span>Tipo {form.relacion === 'Proveedor' && '(opcional)'}</span>
          <select className="input" value={form.tipo_tercero} onChange={cambiar('tipo_tercero')}>
            <option value="">— Sin tipo —</option>
            {TIPOS_TERCERO.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="campo campo-ancho">
          <span>Ciudad</span>
          <select className="input" value={form.id_ciudad} onChange={cambiar('id_ciudad')}>
            <option value="">Elige una ciudad...</option>
            {ciudades.map((c) => (
              <option key={c.id_ciudad} value={c.id_ciudad}>
                {c.ciudad} ({c.departamento})
              </option>
            ))}
          </select>
        </label>

        {error && <div className="alerta alerta-error campo-ancho">{error}</div>}

        <div className="acciones-form campo-ancho">
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear y seleccionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
