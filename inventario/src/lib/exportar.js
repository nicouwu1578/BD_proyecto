import logoUrl from '../assets/logo.png'
import { formatoFecha, formatoNumero, formatoPesos } from './formato'

function hojas(r) {
  return [
    {
      nombre: 'Resumen',
      columnas: ['Indicador', 'Valor'],
      filas: [
        ['Ventas (salidas + traslados)', r.resumen.totalVentas],
        ['Compras (entradas)', r.resumen.totalCompras],
        ['Diferencia (margen aproximado)', r.resumen.diferencia],
        ['Remisiones', r.resumen.remisiones],
      ],
      dinero: [1],
      dineroFilas: [0, 1, 2],
    },
    {
      nombre: 'Ventas y compras por mes',
      columnas: ['Mes', 'Ventas', 'Compras', 'Diferencia'],
      filas: r.porMes.map((m) => [m.etiqueta, m.ventas, m.compras, m.ventas - m.compras]),
      dinero: [1, 2, 3],
    },
    {
      nombre: 'Productos más vendidos',
      columnas: ['Código', 'Producto', 'Unidades', 'Valor'],
      filas: r.masVendidos.map((p) => [p.codigo, p.producto, p.unidades, p.valor]),
      dinero: [3],
    },
    {
      nombre: 'Ventas por cliente',
      columnas: ['Cliente', 'Ventas'],
      filas: r.porCliente.map((x) => [x.nombre, x.valor]),
      dinero: [1],
    },
    {
      nombre: 'Ventas por ciudad',
      columnas: ['Ciudad', 'Ventas'],
      filas: r.porCiudad.map((x) => [x.nombre, x.valor]),
      dinero: [1],
    },
    {
      nombre: 'Ventas por departamento',
      columnas: ['Departamento', 'Ventas'],
      filas: r.porDepartamento.map((x) => [x.nombre, x.valor]),
      dinero: [1],
    },
    {
      nombre: 'Compras por proveedor',
      columnas: ['Proveedor', 'Compras'],
      filas: r.porProveedor.map((x) => [x.nombre, x.valor]),
      dinero: [1],
    },
    {
      nombre: 'Movimientos por bodega',
      columnas: ['Bodega', 'Entradas', 'Salidas', 'Traslados enviados', 'Traslados recibidos', 'Ajustes', 'Remisiones'],
      filas: r.porBodega.map((b) => [b.bodega, b.entradas, b.salidas, b.enviados, b.recibidos, b.ajustes, b.remisiones]),
      dinero: [],
    },
  ]
}

const nombreArchivo = (desde, hasta, ext) => `reportes_multitornillos_${desde}_a_${hasta}.${ext}`

export async function exportarExcel(reportes, desde, hasta) {
  const XLSX = await import('xlsx')
  const libro = XLSX.utils.book_new()
  for (const h of hojas(reportes)) {
    const hoja = XLSX.utils.aoa_to_sheet([h.columnas, ...h.filas])
    hoja['!cols'] = h.columnas.map((c, i) => ({
      wch: Math.max(c.length, ...h.filas.map((f) => String(f[i] ?? '').length)) + 2,
    }))
    h.filas.forEach((f, fi) =>
      f.forEach((valor, ci) => {
        const esDinero = h.dineroFilas ? h.dineroFilas.includes(fi) && ci === 1 : h.dinero.includes(ci)
        const celda = hoja[XLSX.utils.encode_cell({ r: fi + 1, c: ci })]
        if (celda && typeof valor === 'number') celda.z = esDinero ? '"$"#,##0' : '#,##0'
      }),
    )
    XLSX.utils.book_append_sheet(libro, hoja, h.nombre.slice(0, 31))
  }
  XLSX.writeFile(libro, nombreArchivo(desde, hasta, 'xlsx'))
}

async function imagenComoDataUrl(url) {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolver) => {
    const lector = new FileReader()
    lector.onload = () => resolver(lector.result)
    lector.readAsDataURL(blob)
  })
}

export async function exportarPdf(reportes, desde, hasta) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()

  const logo = await imagenComoDataUrl(logoUrl).catch(() => null)
  if (logo) doc.addImage(logo, 'PNG', 14, 10, 18, 18)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(43, 45, 49)
  doc.text('Multitornillos · Reportes', 36, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110, 113, 118)
  doc.text(`Período: ${formatoFecha(desde)} a ${formatoFecha(hasta)}`, 36, 24)
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, ancho - 14, 24, { align: 'right' })
  doc.setDrawColor(215, 20, 26)
  doc.setLineWidth(0.8)
  doc.line(14, 31, ancho - 14, 31)

  let y = 40
  const alto = doc.internal.pageSize.getHeight()
  for (const h of hojas(reportes)) {
    if (y > alto - 40) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(43, 45, 49)
    doc.text(h.nombre, 14, y)
    autoTable(doc, {
      startY: y + 3,
      head: [h.columnas],
      body: h.filas.map((f, fi) =>
        f.map((v, ci) => {
          if (typeof v !== 'number') return v
          const esDinero = h.dineroFilas ? h.dineroFilas.includes(fi) && ci === 1 : h.dinero.includes(ci)
          return esDinero ? formatoPesos(v) : formatoNumero(v)
        }),
      ),
      theme: 'striped',
      headStyles: { fillColor: [215, 20, 26], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 1.8 },
      columnStyles: Object.fromEntries(
        h.columnas.map((_, i) => [i, { halign: i === 0 || (i === 1 && typeof h.filas[0]?.[1] === 'string') ? 'left' : 'right' }]),
      ),
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(140, 143, 148)
    doc.text(`Página ${i} de ${paginas}`, ancho - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
  }
  doc.save(nombreArchivo(desde, hasta, 'pdf'))
}
