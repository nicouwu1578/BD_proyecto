import { FiArrowDownCircle, FiArrowUpCircle, FiSliders } from 'react-icons/fi'

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
  Ajuste: {
    titulo: 'Ajuste',
    subtitulo: 'Corrección de stock: sumar o restar',
    icono: FiSliders,
    clase: 'tipo-ajuste',
    relaciones: [],
    nombreTercero: null,
    restaStock: false,
  },
}

export const ORDEN_TIPOS = ['Entrada', 'Salida', 'Ajuste']

export const BODEGA_PRINCIPAL = 6769

export const CLIENTE_MOSTRADOR = 222222222222

export const TIPOS_TERCERO = ['Taller', 'Distribuidor', 'Persona', 'Otros']

// Apagado hasta confirmar que trg_movimiento_anulacion solo revierte el stock al ANULAR
export const PERMITIR_MARCAR_REALIZADA = false
