import { jsPDF } from 'jspdf'
import type { ActaResuelta } from '../utils/acta'

/**
 * Genera el Acta de Ejecución Parcial como PDF de dos páginas (A4), inspirado en el formato de
 * referencia F-GJ-1140-238,37-082 v3.0. Es una PLANTILLA DE REFERENCIA: sin logotipos, sin firmas y
 * con un aviso visible de que no es un documento oficial aprobado.
 *
 * Cada página se compone de bloques que primero se miden y luego se dibujan. Si el contenido no cabe,
 * se reduce el tamaño de letra; si aun así no cabe, se lanza ActaDesbordadaError en lugar de cortar texto.
 */

const PAGINA = { ancho: 210, alto: 297 }
const MARGEN = { x: 12, arriba: 10, abajo: 10 }
const ANCHO = PAGINA.ancho - 2 * MARGEN.x
const ALTO_ENCABEZADO = 17
const ALTO_PIE = 9
const SEPARACION = 4
const PT_A_MM = 0.3528
const PAD = { x: 1.4, y: 0.9 }
const INTERLINEADO = 1.18
export const FUENTE_BASE = 8
export const FUENTE_MINIMA = 6

const GRIS = [205, 205, 205] as const
const GRIS_CLARO = [235, 235, 235] as const

export const FORMATO_REFERENCIA = { codigo: 'F-GJ-1140-238,37-082', version: '3.0', fecha: 'JULIO-12-2021' }

export class ActaDesbordadaError extends Error {
  constructor() {
    super(
      'El contenido no cabe en dos páginas sin cortar texto. Acorta el objeto contractual, las observaciones de las modificaciones o los nombres y tipos más extensos.',
    )
    this.name = 'ActaDesbordadaError'
  }
}

// Las fuentes estándar de PDF usan WinAnsi: se sustituyen los caracteres que no puede representar.
const EXTRA_WINANSI = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')
function sanitizar(texto: string): string {
  return texto
    .normalize('NFC')
    .replace(/[−‐‑]/g, '-')
    .replace(/\t/g, ' ')
    .replace(/[^\n\x20-\xff]/g, (c) => (EXTRA_WINANSI.has(c) ? c : '?'))
}

interface Lienzo {
  doc: jsPDF
  /** Tamaño de letra base de la página, en puntos. */
  f: number
}

interface Celda {
  texto: string
  ancho: number
  negrita?: boolean
  relleno?: readonly [number, number, number]
  alinear?: 'left' | 'center'
  /** Escala respecto a la letra base. */
  escala?: number
  sinBorde?: boolean
}

interface Bloque {
  alto(l: Lienzo): number
  dibujar(l: Lienzo, x: number, y: number): void
  /** Título de sección: nunca debe quedar solo al final de una página. */
  esTitulo?: boolean
}

function fijarFuente(l: Lienzo, negrita = false, escala = 1) {
  l.doc.setFont('helvetica', negrita ? 'bold' : 'normal')
  l.doc.setFontSize(l.f * escala)
}

const altoLinea = (l: Lienzo, escala = 1) => l.f * escala * PT_A_MM * INTERLINEADO

function lineasDe(l: Lienzo, c: Celda): string[] {
  fijarFuente(l, c.negrita, c.escala)
  return l.doc.splitTextToSize(sanitizar(c.texto || ' '), c.ancho - 2 * PAD.x) as string[]
}

function altoCelda(l: Lienzo, c: Celda): number {
  return lineasDe(l, c).length * altoLinea(l, c.escala) + 2 * PAD.y
}

function dibujarCelda(l: Lienzo, c: Celda, x: number, y: number, alto: number) {
  const { doc } = l
  if (c.relleno) {
    doc.setFillColor(...c.relleno)
    doc.rect(x, y, c.ancho, alto, 'F')
  }
  if (!c.sinBorde) {
    doc.setDrawColor(60, 60, 60)
    doc.setLineWidth(0.2)
    doc.rect(x, y, c.ancho, alto, 'S')
  }
  const lineas = lineasDe(l, c)
  doc.setTextColor(20, 20, 20)
  const tx = c.alinear === 'center' ? x + c.ancho / 2 : x + PAD.x
  // Texto con línea base superior: la primera línea empieza en el borde superior más el relleno.
  doc.text(lineas, tx, y + PAD.y + l.f * (c.escala ?? 1) * PT_A_MM * 0.12, {
    baseline: 'top',
    align: c.alinear === 'center' ? 'center' : 'left',
    lineHeightFactor: INTERLINEADO,
  })
}

/** Fila de celdas contiguas. */
function fila(celdas: Celda[]): Bloque {
  const alto = (l: Lienzo) => Math.max(...celdas.map((c) => altoCelda(l, c)))
  return {
    alto,
    dibujar(l, x, y) {
      const h = alto(l)
      let cx = x
      for (const c of celdas) {
        dibujarCelda(l, c, cx, y, h)
        cx += c.ancho
      }
    },
  }
}

/** Etiqueta a la izquierda que abarca varias subfilas a la derecha. */
function grupo(etiqueta: Celda, subfilas: Celda[][]): Bloque {
  const altos = (l: Lienzo) => {
    const hs = subfilas.map((s) => Math.max(...s.map((c) => altoCelda(l, c))))
    const total = hs.reduce((a, b) => a + b, 0)
    const necesario = altoCelda(l, etiqueta)
    if (necesario > total) hs[hs.length - 1] += necesario - total
    return hs
  }
  return {
    alto: (l) => altos(l).reduce((a, b) => a + b, 0),
    dibujar(l, x, y) {
      const hs = altos(l)
      dibujarCelda(l, etiqueta, x, y, hs.reduce((a, b) => a + b, 0))
      let cy = y
      subfilas.forEach((s, i) => {
        let cx = x + etiqueta.ancho
        for (const c of s) {
          dibujarCelda(l, c, cx, cy, hs[i])
          cx += c.ancho
        }
        cy += hs[i]
      })
    },
  }
}

function seccion(titulo: string, ancho = ANCHO): Bloque {
  return { ...fila([{ texto: titulo, ancho, negrita: true, relleno: GRIS, alinear: 'center' }]), esTitulo: true }
}

function parrafo(texto: string, opciones: { ancho?: number; sangria?: number; negrita?: boolean } = {}): Bloque {
  const ancho = opciones.ancho ?? ANCHO
  const sangria = opciones.sangria ?? 0
  const celda: Celda = { texto, ancho: ancho - sangria, negrita: opciones.negrita, sinBorde: true }
  return {
    alto: (l) => altoCelda(l, celda),
    dibujar: (l, x, y) => dibujarCelda(l, celda, x + sangria, y, altoCelda(l, celda)),
  }
}

function espacio(mm: number): Bloque {
  return { alto: () => mm, dibujar: () => {} }
}

/** Bloques desplazados horizontalmente (tablas centradas dentro de las constancias). */
function sangrar(mm: number, bloques: Bloque[]): Bloque {
  return {
    alto: (l) => bloques.reduce((s, b) => s + b.alto(l), 0),
    dibujar(l, x, y) {
      let cy = y
      for (const b of bloques) {
        b.dibujar(l, x + mm, cy)
        cy += b.alto(l)
      }
    },
  }
}

/** Marco con borde alrededor de un conjunto de bloques. */
function marco(bloques: Bloque[], relleno = 1.5): Bloque {
  const alto = (l: Lienzo) => bloques.reduce((s, b) => s + b.alto(l), 0) + 2 * relleno
  return {
    alto,
    dibujar(l, x, y) {
      let cy = y + relleno
      for (const b of bloques) {
        b.dibujar(l, x, cy)
        cy += b.alto(l)
      }
      l.doc.setDrawColor(60, 60, 60)
      l.doc.setLineWidth(0.2)
      l.doc.rect(x, y, ANCHO, alto(l), 'S')
    },
  }
}

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------

const ETIQUETA = 46
const VALOR = ANCHO - ETIQUETA
const SUB = 52

const et = (texto: string): Celda => ({ texto, ancho: ETIQUETA, negrita: true })
const val = (texto: string, ancho = VALOR): Celda => ({ texto, ancho })
const simple = (etiqueta: string, valor: string) => fila([et(etiqueta), val(valor)])
const pares = (etiqueta: string, filas: [string, string][]) =>
  grupo(et(etiqueta), filas.map(([a, b]) => [val(a, SUB), val(b, VALOR - SUB)]))

function tablaModificaciones(a: ActaResuelta): Bloque {
  const anchos = [29, 15, 33, 32, 31] // suma = VALOR
  const cab = (textos: string[], unir = false): Celda[] =>
    unir
      ? [
          ...textos.slice(0, 3).map((t, i) => ({ texto: t, ancho: anchos[i], negrita: true, relleno: GRIS_CLARO, alinear: 'center' as const, escala: 0.85 })),
          { texto: textos[3], ancho: anchos[3] + anchos[4], negrita: true, relleno: GRIS_CLARO, alinear: 'center' as const, escala: 0.85 },
        ]
      : textos.map((t, i) => ({ texto: t, ancho: anchos[i], negrita: true, relleno: GRIS_CLARO, alinear: 'center' as const, escala: 0.85 }))
  const cel = (textos: string[], unir = false): Celda[] =>
    unir
      ? [
          ...textos.slice(0, 3).map((t, i) => ({ texto: t, ancho: anchos[i], alinear: 'center' as const, escala: 0.85 })),
          { texto: textos[3], ancho: anchos[3] + anchos[4], alinear: 'center' as const, escala: 0.85 },
        ]
      : textos.map((t, i) => ({ texto: t, ancho: anchos[i], alinear: 'center' as const, escala: 0.85 }))
  const NA = 'No Aplica'
  const plazo = (nombre: string, filas: ActaResuelta['suspensiones']) =>
    filas.length
      ? filas.map((f, i) => cel([i === 0 ? nombre : '', f.numero, f.tiempo, f.fechaInicial, f.fechaFinal]))
      : [cel([nombre, NA, NA, NA, NA])]

  const subfilas: Celda[][] = [
    cab(['Tipo de Modificación', 'No.', 'Tiempo', 'Fecha Inicial', 'Fecha Final']),
    ...plazo('Suspensiones', a.suspensiones),
    ...plazo('Prórrogas', a.prorrogas),
    cab(['Tipo de Modificación', 'No.', 'Fecha de la adición', 'Valor adicionado', 'Valor total del contrato']),
    ...(a.adiciones.length
      ? a.adiciones.map((f, i) => cel([i === 0 ? 'Adiciones' : '', f.numero, f.fecha, f.valor, f.valorTotal]))
      : [cel(['Adiciones', NA, NA, NA, NA])]),
    cab(['Otras Modificaciones', 'No.', 'Fecha de la modificación', 'Observaciones'], true),
    ...(a.otrasModificaciones.length
      ? a.otrasModificaciones.map((f, i) => cel([i === 0 ? 'Cesión / Otrosí / Aclaraciones' : '', f.numero, f.fecha, f.observaciones], true))
      : [cel(['Cesión / Otrosí / Aclaraciones', NA, NA, NA], true)]),
  ]
  return grupo(et('MODIFICACIONES DEL CONTRATO'), subfilas)
}

function pagina1(a: ActaResuelta): Bloque[] {
  const ss = a.seguridadSocial
  const anchoSS = VALOR / 4
  const amortizado = a.porcentajeAmortizacion
    ? `${a.porcentajeAmortizacion}    Valor a amortizar: ${a.valorAmortizar}`
    : `Valor a amortizar: ${a.valorAmortizar}`
  return [
    seccion('DATOS DEL CONTRATO'),
    simple('DEPENDENCIA', a.dependencia),
    simple('ACTA No.', a.numeroActa),
    simple('FECHA DEL ACTA', a.fechaActa),
    simple('No. DE CONTRATO Y FECHA', a.contratoYFecha),
    simple('TIPO DE CONTRATO', a.tipoContrato),
    simple('CONTRATANTE', a.contratante),
    simple('OBJETO', a.objeto),
    pares('CONTRATISTA', [['NOMBRE', a.contratista.nombre], ['C.C./NIT', a.contratista.identificacion]]),
    pares('REPRESENTANTE LEGAL', [['NOMBRE', a.representante.nombre], ['C.C./NIT', a.representante.identificacion]]),
    pares('ORDENADOR DEL GASTO', [['NOMBRE', a.ordenador.nombre], ['CARGO', a.ordenador.cargo], ['C.C.', a.ordenador.identificacion]]),
    pares('SUPERVISOR', [['NOMBRE', a.supervisor.nombre], ['C.C./NIT', a.supervisor.identificacion]]),
    simple('VALOR DEL CONTRATO', a.valorContrato),
    simple('VALOR ADICIONADO', a.valorAdicionado),
    simple(`ANTICIPO O PAGO ANTICIPADO ${a.anticipoPorcentaje}`, a.anticipo),
    pares('CDP', [['NÚMERO', a.cdp.numero], ['FECHA', a.cdp.fecha]]),
    pares('CDP ADICIONAL', [['NÚMERO', a.cdpAdicional.numero], ['FECHA', a.cdpAdicional.fecha]]),
    pares('RP', [['NÚMERO', a.rp.numero], ['FECHA', a.rp.fecha]]),
    pares('RP ADICIONAL', [['NÚMERO', a.rpAdicional.numero], ['FECHA', a.rpAdicional.fecha]]),
    pares('PLAZO DEL CONTRATO', [
      ['Fecha de Inicio', a.fechaInicio],
      ['Fecha de Finalización', a.fechaFinalizacion],
      ['Nueva Fecha Terminación', a.nuevaFechaTerminacion],
      ['Duración', a.duracion],
    ]),
    tablaModificaciones(a),
    simple('FECHA DE APROBACIÓN DE PÓLIZAS', a.fechaAprobacionPolizas),
    seccion('DATOS PARA PAGO DEL CONTRATO'),
    grupo(et('PERIODO DE COBRO'), [[val(`DESDE: ${a.periodoDesde}`)], [val(`HASTA: ${a.periodoHasta}`)]]),
    simple('VALOR A COBRAR', a.valorCobrar),
    simple('ANTICIPO AMORTIZADO', amortizado),
    grupo(et('SEGURIDAD SOCIAL'), [
      ['PERIODO DE COTIZACIÓN', 'FECHA DE PAGO', 'Nro. PLANILLA INTEGRADA', 'INGRESO BASE DE COTIZACIÓN'].map((t) => ({
        texto: t, ancho: anchoSS, negrita: true, relleno: GRIS_CLARO, alinear: 'center' as const, escala: 0.85,
      })),
      [ss.periodo, ss.fechaPago, ss.planilla, ss.ibc].map((t) => ({ texto: t, ancho: anchoSS, alinear: 'center' as const })),
    ]),
  ]
}

function pagina2(a: ActaResuelta): Bloque[] {
  const ss = a.seguridadSocial
  const c4 = ANCHO / 4
  const cab = (t: string): Celda => ({ texto: t, ancho: c4, negrita: true, relleno: GRIS_CLARO, alinear: 'center', escala: 0.9 })
  const cel = (t: string, negrita = false): Celda => ({ texto: t, ancho: c4, alinear: 'center', negrita })

  const representacion = a.representacionPropia
    ? `${a.contratista.nombre} quien actúa en nombre y representación propia`
    : `${a.representante.nombre} quien actúa en calidad de representante legal de ${a.contratista.nombre}`
  const informe = a.referenciaInforme ? ` (${a.referenciaInforme})` : ''

  const detalle = [95, 56]
  const filaDetalle = (t: string, v: string) =>
    fila([{ texto: t, ancho: detalle[0], negrita: true }, { texto: v, ancho: detalle[1] }])

  const estampillas: Bloque[] =
    a.estampillas === null
      ? [parrafo('5. Estampillas: No Aplica. El contratista indicó que el contrato no requiere estampillas.')]
      : [
          parrafo('5. Se adhiere y anula estampilla (s):'),
          espacio(1),
          sangrar(17, [
            fila(['ESTAMPILLA', 'No.', 'FECHA DE PAGO', 'VALOR'].map((t, i) => ({
              texto: t, ancho: [52, 42, 28, 30][i], negrita: true, relleno: GRIS, alinear: 'center' as const, escala: 0.9,
            }))),
            ...a.estampillas.map((s) =>
              fila([s.tipo, s.numero, s.fechaPago, s.valor].map((t, i) => ({ texto: t, ancho: [52, 42, 28, 30][i], alinear: 'center' as const }))),
            ),
          ]),
        ]

  return [
    fila([cab('PAGO DE LA SEGURIDAD SOCIAL'), cab('ENTIDAD PROMOTORA DE SALUD'), cab('ADMINISTRADORA DE FONDO DE PENSIONES'), cab('ADMINISTRADORA DE RIESGOS LABORALES')]),
    fila([cel(''), cel(ss.eps), cel(ss.fondoPensiones), cel(ss.arl)]),
    fila([cel('VALOR PAGADO', true), cel(ss.valorSalud), cel(ss.valorPension), cel(ss.valorArl)]),
    espacio(2),
    seccion('CONSTANCIAS'),
    marco([
      parrafo(
        `1. En la ciudad de ${a.ciudad}, se reunieron ${a.supervisor.nombre} quien actúa en nombre y representación de ${a.entidad} en calidad de Supervisor, y por la otra ${representacion}, con el fin de entregar y recibir el informe de avance de ejecución del Contrato.`,
      ),
      espacio(1.5),
      parrafo('2. El Contratista acreditó el pago de la seguridad social integral efectuado mediante la planilla relacionada.'),
      espacio(1.5),
      parrafo(
        `3. El Contratista ha ejecutado las actividades estipuladas en el Contrato de acuerdo a las especificaciones técnicas y a satisfacción según informe de cumplimiento de obligaciones contractuales${informe}, las cuales fueron aprobadas por el Supervisor.`,
      ),
      espacio(1.5),
      parrafo('4. El Supervisor autoriza el pago de las actividades realizadas, de acuerdo con el siguiente detalle:'),
      espacio(1.5),
      sangrar(17, [
        filaDetalle(`Valor ejecutado en la presente acta: ${a.numeroActa}`, a.valores.ejecutado),
        filaDetalle('Valor IVA:', a.valores.iva),
        filaDetalle('Menos amortización del anticipo / Menos pago anticipado', a.valores.amortizacion),
        filaDetalle('Valor bruto ejecutado a pagar', a.valores.bruto),
      ]),
      espacio(2),
      ...estampillas,
      espacio(1),
    ]),
    espacio(3),
    parrafo(`Para constancia de lo anterior, se suscribe la presente acta en ${a.ciudad} el ${a.fechaLarga}.`),
    espacio(3),
    firmas(a),
  ]
}

/** Espacios en blanco para firma manual: nunca se insertan imágenes de firma. */
function firmas(a: ActaResuelta): Bloque {
  const col = ANCHO / 2
  const contratistaRol = a.representacionPropia ? 'Representación propia' : `Representante legal: ${a.representante.nombre}`
  const columnas = [
    ['Supervisor', a.supervisor.nombre, a.entidad, 'Supervisor'],
    ['Contratista', a.contratista.nombre, contratistaRol, 'Contratista'],
  ]
  const ESPACIO_FIRMA = 13
  const lineasColumna = (l: Lienzo, c: string[]) =>
    [c[1], c[2], c[3]].map((t, i) => lineasDe(l, { texto: t, ancho: col - 6, negrita: i === 0 }))
  const altoColumna = (l: Lienzo, c: string[]) =>
    altoLinea(l) + ESPACIO_FIRMA + lineasColumna(l, c).reduce((s, ls) => s + ls.length * altoLinea(l), 0) + 2
  return {
    alto: (l) => Math.max(...columnas.map((c) => altoColumna(l, c))),
    dibujar(l, x, y) {
      columnas.forEach((c, i) => {
        const cx = x + i * col + 2
        fijarFuente(l)
        l.doc.text(c[0], cx, y, { baseline: 'top' })
        const yLinea = y + altoLinea(l) + ESPACIO_FIRMA
        l.doc.setLineWidth(0.25)
        l.doc.line(cx, yLinea, cx + col - 12, yLinea)
        let cy = yLinea + 1.2
        lineasColumna(l, c).forEach((ls, j) => {
          fijarFuente(l, j === 0)
          l.doc.text(ls, cx, cy, { baseline: 'top', lineHeightFactor: INTERLINEADO })
          cy += ls.length * altoLinea(l)
        })
      })
    },
  }
}

// ---------------------------------------------------------------------------
// Encabezado, pie y ensamblado
// ---------------------------------------------------------------------------

function encabezado(doc: jsPDF, pagina: number, total: number) {
  const x = MARGEN.x
  const y = MARGEN.arriba
  const izq = 38
  const der = 52
  const centro = ANCHO - izq - der
  doc.setDrawColor(60, 60, 60)
  doc.setLineWidth(0.25)
  doc.rect(x, y, ANCHO, ALTO_ENCABEZADO)
  doc.line(x + izq, y, x + izq, y + ALTO_ENCABEZADO)
  doc.line(x + izq + centro, y, x + izq + centro, y + ALTO_ENCABEZADO)

  // Sin logotipos oficiales: en su lugar se identifica el documento como plantilla.
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text(['PLANTILLA DE', 'REFERENCIA'], x + izq / 2, y + 5.2, { align: 'center', baseline: 'top' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text('Borrador · Cuenta Ya', x + izq / 2, y + 12, { align: 'center', baseline: 'top' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(['ACTA DE EJECUCIÓN PARCIAL DEL', 'CONTRATO/CONVENIO'], x + izq + centro / 2, y + 5.3, { align: 'center', baseline: 'top' })

  const filas = [
    `Código: ${FORMATO_REFERENCIA.codigo}`,
    `Versión: ${FORMATO_REFERENCIA.version}`,
    `Fecha: ${FORMATO_REFERENCIA.fecha}`,
    `Página: ${pagina} de ${total}`,
  ]
  const altoFila = ALTO_ENCABEZADO / filas.length
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.8)
  filas.forEach((t, i) => {
    const fy = y + i * altoFila
    if (i > 0) doc.line(x + izq + centro, fy, x + ANCHO, fy)
    doc.text(t, x + izq + centro + 1.5, fy + altoFila / 2, { baseline: 'middle' })
  })
}

function pie(doc: jsPDF) {
  const y = PAGINA.alto - MARGEN.abajo - ALTO_PIE + 2
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.2)
  doc.line(MARGEN.x, y - 1.2, MARGEN.x + ANCHO, y - 1.2)
  doc.setTextColor(70, 70, 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.2)
  const texto = sanitizar(
    `Borrador generado con Cuenta Ya como plantilla de referencia basada en el formato ${FORMATO_REFERENCIA.codigo} versión ${FORMATO_REFERENCIA.version}. ` +
      'No es un documento oficial aprobado ni una reproducción certificada del formato institucional; no ha sido revisado por la entidad y requiere verificación y firma manual.',
  )
  doc.text(doc.splitTextToSize(texto, ANCHO) as string[], MARGEN.x, y, { baseline: 'top', lineHeightFactor: 1.15 })
}

const ALTO_DISPONIBLE = PAGINA.alto - MARGEN.arriba - ALTO_ENCABEZADO - SEPARACION - ALTO_PIE - MARGEN.abajo - 2

export interface ResultadoActaPdf {
  bytes: ArrayBuffer
  paginas: number
  /** Tamaño de letra base usado en cada página (puntos). */
  tamanosFuente: number[]
  /** Bloques del final de la página 1 que se pasaron a la página 2 para no reducir demasiado la letra. */
  bloquesMovidos: number
}

/** Letra mínima con la que se prefiere la división de páginas del formato de referencia. */
const FUENTE_PREFERIDA = 7

interface Distribucion {
  paginas: [Bloque[], Bloque[]]
  f: number
  movidos: number
}

/**
 * Busca la distribución más legible que quepa en dos páginas:
 * 1) división del formato de referencia con letra ≥ FUENTE_PREFERIDA;
 * 2) si no basta, pasa bloques completos del final de la página 1 a la página 2
 *    (nunca parte una tabla ni deja un título de sección solo), con la mayor letra posible.
 */
function distribuir(doc: jsPDF, p1: Bloque[], p2: Bloque[]): Distribucion | null {
  const cabe = (bloques: Bloque[], f: number) =>
    bloques.reduce((s, b) => s + b.alto({ doc, f }), 0) <= ALTO_DISPONIBLE
  const tamanos: number[] = []
  for (let f = FUENTE_BASE; f >= FUENTE_MINIMA - 1e-9; f -= 0.25) tamanos.push(Math.round(f * 100) / 100)

  for (const f of tamanos.filter((t) => t >= FUENTE_PREFERIDA)) {
    if (cabe(p1, f) && cabe(p2, f)) return { paginas: [p1, p2], f, movidos: 0 }
  }
  for (const f of tamanos) {
    for (let k = p1.length - 1; k >= 1; k--) {
      if (p1[k - 1].esTitulo) continue
      const primera = p1.slice(0, k)
      const segunda = [...p1.slice(k), espacio(SEPARACION), ...p2]
      if (cabe(primera, f) && cabe(segunda, f)) return { paginas: [primera, segunda], f, movidos: p1.length - k }
    }
  }
  return null
}

export function generarActaPdf(acta: ActaResuelta): ResultadoActaPdf {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
  doc.setProperties({
    title: `Acta de ejecución parcial N.º ${acta.numeroActa} (borrador)`,
    subject: 'Plantilla de referencia generada con Cuenta Ya. No es un documento oficial.',
    creator: 'Cuenta Ya',
  })

  const p1 = pagina1(acta)
  const p2 = pagina2(acta)
  const distribucion = distribuir(doc, p1, p2)
  if (!distribucion) throw new ActaDesbordadaError()

  const lienzo: Lienzo = { doc, f: distribucion.f }
  distribucion.paginas.forEach((bloques, i) => {
    if (i > 0) doc.addPage()
    encabezado(doc, i + 1, distribucion.paginas.length)
    let y = MARGEN.arriba + ALTO_ENCABEZADO + SEPARACION
    for (const b of bloques) {
      b.dibujar(lienzo, MARGEN.x, y)
      y += b.alto(lienzo)
    }
    pie(doc)
  })

  return {
    bytes: doc.output('arraybuffer'),
    paginas: doc.getNumberOfPages(),
    tamanosFuente: distribucion.paginas.map(() => distribucion.f),
    bloquesMovidos: distribucion.movidos,
  }
}
