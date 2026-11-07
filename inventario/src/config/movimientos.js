
import { FiArrowDownCircle, FiArrowUpCircle, FiTruck, FiSliders } from 'react-icons/fi'

export const TIPOS = {
  Entrada: {
    titulo: 'Entrada',
    subtitulo: 'Compra a un proveedor',
    icono: FiArrowDownCircle,
    clase: 'tipo-entrada',
    relaciones: ['Proveedor', 'Ambos'],
    nombreTercero: 'Proveedor',
    restaStock: false,
  },
  Salida: {
    titulo: 'Salida',
    subtitulo: 'Venta a un cliente',
    icono: FiArrowUpCircle,
    clase: 'tipo-salida',
    relaciones: ['Cliente', 'Ambos'],
    nombreTercero: 'Cliente',
    restaStock: true,
  },
  Traslado: {
    titulo: 'Traslado',
    subtitulo: 'Envío a la bodega de un cliente',
    icono: FiTruck,
    clase: 'tipo-traslado',
    relaciones: ['Cliente', 'Ambos'],
    nombreTercero: 'Cliente',
    restaStock: true,
  },
  Ajuste: {
    titulo: 'Ajuste',
    subtitulo: 'Corrección de inventario (suma stock)',
    icono: FiSliders,
    clase: 'tipo-ajuste',
    relaciones: ['Proveedor', 'Cliente', 'Ambos'],
    nombreTercero: 'Tercero',
    restaStock: false,
  },
}

export const ORDEN_TIPOS = ['Entrada', 'Salida', 'Traslado', 'Ajuste']

export const BODEGA_PRINCIPAL = 6769


export const CLIENTE_MOSTRADOR = 222222222222


export const TIPOS_TERCERO = ['Taller', 'Distribuidor', 'Persona', 'Otros']


export const PERMITIR_MARCAR_REALIZADA = false
