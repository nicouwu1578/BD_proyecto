

export const STOCK_MINIMO_POR_DEFECTO = 500
const CLAVE = 'multitornillos.stockMinimo'

export function leerStockMinimo() {
  try {
    const guardado = Number(localStorage.getItem(CLAVE))
    return guardado > 0 ? guardado : STOCK_MINIMO_POR_DEFECTO
  } catch {
    return STOCK_MINIMO_POR_DEFECTO // algunos navegadores bloquean localStorage
  }
}

export function guardarStockMinimo(valor) {
  try {
    localStorage.setItem(CLAVE, String(valor))
  } catch {

  }
}
