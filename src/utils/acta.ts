import type { EstadoValidacion } from '../hooks/useValidacionAnexo'
import type { CampoTextoPerfil, DatosActa, DatosEstampillas, DatosPlanilla, InformeActividades, PerfilContratista } from '../types'
import { etiquetaPeriodo } from './informes'
import { calcularDuracion } from './perfil'
import { faltantesEstampillas, faltantesPlanilla, FECHA_ISO, type ArchivosEstampilla, type Errores } from './soportes'

export const MAX_FILAS_MODIFICACION = 3

/** Solo los datos que cambian en cada acta; el resto se toma de Mi perfil, la planilla y las estampillas. */
export function actaVacia(): DatosActa {
  return {
    numeroActa: '',
    fechaActa: '',
    ciudad: '',
    periodoDesde: '',
    periodoHasta: '',
    valorCobrar: '',
    valorIva: '',
    valorAmortizar: '',
    porcentajeAmortizacion: '',
    referenciaInforme: '',
  }
}

/** Datos básicos de Mi perfil que el acta necesita (los contractuales vienen de la revisión de la minuta). */
export const CAMPOS_PERFIL_ACTA: [CampoTextoPerfil, string][] = [
  ['nombres', 'nombre'],
  ['apellidos', 'apellido'],
  ['numeroIdentificacion', 'número de identificación'],
  ['numeroContrato', 'número de contrato'],
  ['fechaInicio', 'fecha de inicio del contrato'],
  ['fechaTerminacion', 'fecha de finalización del contrato'],
]

export function faltantesPerfil(perfil: PerfilContratista): string[] {
  return CAMPOS_PERFIL_ACTA.filter(([campo]) => !perfil[campo].trim()).map(([, etiqueta]) => etiqueta)
}

/** Reglas de cálculo explícitas: se muestran tal cual en la interfaz. */
export const REGLAS_CALCULO = [
  'Valor adicionado = suma de las adiciones registradas en Mi perfil.',
  'Valor total del contrato = valor del contrato + valor adicionado.',
  'Porcentaje de anticipo = anticipo ÷ valor total del contrato × 100.',
  'Si no hubo anticipo (0), la amortización es 0. Si no eres responsable de IVA, el IVA es 0.',
  'Valor bruto ejecutado a pagar = valor a cobrar + valor IVA − amortización del anticipo.',
]

const pesos = (s: string) => (/^\d+$/.test(s) ? Number(s) : Number.NaN)

/** El acta pide el valor del IVA solo si el contratista indicó en Mi perfil que es responsable de IVA. */
export const pideIva = (perfil: PerfilContratista) => perfil.responsableIva === 'si'
/** El acta pide la amortización solo si en Mi perfil se registró un anticipo mayor que cero. */
export const pideAmortizacion = (perfil: PerfilContratista) => pesos(perfil.anticipo) > 0

export interface ValoresActa {
  valorContrato: number
  valorAdicionado: number
  valorTotal: number
  anticipo: number
  anticipoPorcentaje: number
  valorCobrar: number
  valorIva: number
  valorAmortizar: number
  bruto: number
}

/** Aplica únicamente las reglas de REGLAS_CALCULO. Devuelve NaN donde falten datos. */
export function calcularValores(acta: DatosActa, perfil: PerfilContratista): ValoresActa {
  const valorContrato = pesos(perfil.valorContrato)
  const valorAdicionado = perfil.adiciones.reduce((suma, a) => suma + (pesos(a.valor) || 0), 0)
  const valorTotal = valorContrato + valorAdicionado
  const anticipo = pesos(perfil.anticipo)
  const valorCobrar = pesos(acta.valorCobrar)
  const valorIva = perfil.responsableIva === 'no' ? 0 : pideIva(perfil) ? pesos(acta.valorIva) : Number.NaN
  const valorAmortizar = anticipo === 0 ? 0 : anticipo > 0 ? pesos(acta.valorAmortizar) : Number.NaN
  return {
    valorContrato,
    valorAdicionado,
    valorTotal,
    anticipo,
    anticipoPorcentaje: valorTotal > 0 ? (anticipo / valorTotal) * 100 : Number.NaN,
    valorCobrar,
    valorIva,
    valorAmortizar,
    bruto: valorCobrar + valorIva - valorAmortizar,
  }
}

const ID = /^[A-Za-z0-9.-]{3,20}$/
const CODIGO = /^[A-Za-z0-9-]{1,20}$/

/**
 * Validador con dos niveles: los errores de formato siempre se registran; los de campo obligatorio
 * solo cuando `exigir` es verdadero (al preparar el acta). Así Mi perfil puede guardarse incompleto.
 */
function validador(exigir: boolean) {
  const e: Errores = {}
  const falta = (campo: string, mensaje: string) => {
    if (exigir) e[campo] = mensaje
  }
  return {
    e,
    texto(campo: string, valor: string, mensaje: string, max = 150) {
      if (!valor.trim()) falta(campo, mensaje)
      else if (valor.length > max) e[campo] = `Máximo ${max} caracteres.`
    },
    patron(campo: string, valor: string, mensaje: string, regex: RegExp, error: string) {
      if (!valor.trim()) falta(campo, mensaje)
      else if (!regex.test(valor.trim())) e[campo] = error
    },
    fecha(campo: string, valor: string, mensaje: string, obligatoria = true) {
      if (!valor) {
        if (obligatoria) falta(campo, mensaje)
      } else if (!FECHA_ISO.test(valor)) e[campo] = 'Usa una fecha válida.'
    },
    dinero(campo: string, valor: string, mensaje: string, positivo: boolean) {
      if (!valor) falta(campo, mensaje)
      else if (!/^\d+$/.test(valor)) e[campo] = 'Usa solo números, sin puntos ni signos.'
      else if (positivo && Number(valor) <= 0) e[campo] = 'El valor debe ser mayor que cero.'
    },
  }
}

/**
 * Datos del contrato para actas registrados en Mi perfil (se diligencian una sola vez).
 * `exigir`: también reporta los obligatorios vacíos (lo usa el acta); sin él, solo errores de formato (Mi perfil).
 */
export function validarContratoActa(p: PerfilContratista, exigir: boolean): Errores {
  const v = validador(exigir)
  const { e } = v
  const valorTotal = pesos(p.valorContrato) + p.adiciones.reduce((s, a) => s + (pesos(a.valor) || 0), 0)

  // Datos generales del contrato
  v.texto('entidadContratante', p.entidadContratante, 'Ingresa la entidad contratante.', 150)
  v.texto('dependenciaContrato', p.dependenciaContrato, 'Ingresa la dependencia del contrato.', 150)
  v.texto('objetoContractual', p.objetoContractual, 'Describe el objeto contractual.', 2000)
  v.dinero('valorContrato', p.valorContrato, 'Ingresa el valor del contrato.', true)
  if (p.vigencia && !/^(19|20)\d{2}$/.test(p.vigencia)) e.vigencia = 'Ingresa el año de la vigencia, por ejemplo 2026.'

  v.texto('tipoContrato', p.tipoContrato, 'Indica el tipo de contrato.', 120)
  v.fecha('fechaContrato', p.fechaContrato, 'Indica la fecha de suscripción del contrato.')
  if (!e.fechaContrato && p.fechaContrato && p.fechaInicio && p.fechaContrato > p.fechaInicio) {
    e.fechaContrato = 'No puede ser posterior a la fecha de inicio del contrato.'
  }
  if (p.nitContratante && !/^[\d.-]{5,20}$/.test(p.nitContratante)) {
    e.nitContratante = 'Usa números, puntos o guion (p. ej. 800.000.000-0).'
  }

  if (p.representacion === 'representante') {
    v.texto('representanteNombre', p.representanteNombre, 'Ingresa el nombre del representante legal.', 120)
    v.patron('representanteIdentificacion', p.representanteIdentificacion, 'Ingresa la identificación del representante legal.', ID, 'Usa entre 3 y 20 números, letras, puntos o guiones.')
  }
  v.texto('ordenadorNombre', p.ordenadorNombre, 'Ingresa el nombre del ordenador del gasto.', 120)
  v.texto('ordenadorCargo', p.ordenadorCargo, 'Ingresa el cargo del ordenador del gasto.', 120)
  v.patron('ordenadorIdentificacion', p.ordenadorIdentificacion, 'Ingresa la cédula del ordenador del gasto.', /^\d{3,15}$/, 'Usa solo números (entre 3 y 15 dígitos).')
  v.texto('supervisorNombre', p.supervisorNombre, 'Ingresa el nombre del supervisor.', 120)
  v.patron('supervisorIdentificacion', p.supervisorIdentificacion, 'Ingresa la identificación del supervisor.', ID, 'Usa entre 3 y 20 números, letras, puntos o guiones.')

  v.dinero('anticipo', p.anticipo, 'Indica el anticipo o pago anticipado del contrato (0 si no hubo).', false)
  if (!e.anticipo && p.anticipo && pesos(p.anticipo) > valorTotal) e.anticipo = 'El anticipo no puede superar el valor total del contrato.'
  if (!p.responsableIva && exigir) e.responsableIva = 'Indica si eres responsable de IVA.'

  const registros = [
    ['CDP', 'cdpNumero', 'cdpFecha', 'cdpAdicionalAplica', 'cdpAdicionalNumero', 'cdpAdicionalFecha'],
    ['RP', 'rpNumero', 'rpFecha', 'rpAdicionalAplica', 'rpAdicionalNumero', 'rpAdicionalFecha'],
  ] as const
  for (const [nombre, numero, fechaCampo, aplica, numeroAdicional, fechaAdicional] of registros) {
    v.patron(numero, p[numero], `Ingresa el número del ${nombre}.`, CODIGO, 'Usa hasta 20 letras, números o guiones.')
    v.fecha(fechaCampo, p[fechaCampo], `Indica la fecha del ${nombre}.`)
    if (p[aplica]) {
      v.patron(numeroAdicional, p[numeroAdicional], `Ingresa el número del ${nombre} adicional.`, CODIGO, 'Usa hasta 20 letras, números o guiones.')
      v.fecha(fechaAdicional, p[fechaAdicional], `Indica la fecha del ${nombre} adicional.`)
    }
  }
  if (!e.cdpFecha && !e.rpFecha && p.cdpFecha && p.rpFecha && p.rpFecha < p.cdpFecha) {
    e.rpFecha = 'La fecha del RP no puede ser anterior a la del CDP.'
  }

  // Modificaciones: opcionales. Solo se validan los registros que el usuario agregó.
  v.fecha('nuevaFechaTerminacion', p.nuevaFechaTerminacion, '', false)
  if (!e.nuevaFechaTerminacion && p.nuevaFechaTerminacion && p.fechaTerminacion && p.nuevaFechaTerminacion <= p.fechaTerminacion) {
    e.nuevaFechaTerminacion = 'Debe ser posterior a la fecha de terminación inicial.'
  }
  for (const lista of ['suspensiones', 'prorrogas'] as const) {
    if (p[lista].length > MAX_FILAS_MODIFICACION) e[lista] = `Máximo ${MAX_FILAS_MODIFICACION} registros.`
    for (const fila of p[lista]) {
      v.texto(`${fila.id}.numero`, fila.numero, 'Indica el número.', 10)
      v.texto(`${fila.id}.tiempo`, fila.tiempo, 'Indica el tiempo (p. ej. 15 días).', 40)
      v.fecha(`${fila.id}.fechaInicial`, fila.fechaInicial, 'Indica la fecha inicial.')
      v.fecha(`${fila.id}.fechaFinal`, fila.fechaFinal, 'Indica la fecha final.')
      if (fila.fechaInicial && fila.fechaFinal && fila.fechaFinal < fila.fechaInicial) {
        e[`${fila.id}.fechaFinal`] = 'No puede ser anterior a la fecha inicial.'
      }
    }
  }
  if (p.adiciones.length > MAX_FILAS_MODIFICACION) e.adiciones = `Máximo ${MAX_FILAS_MODIFICACION} registros.`
  for (const fila of p.adiciones) {
    v.texto(`${fila.id}.numero`, fila.numero, 'Indica el número.', 10)
    v.fecha(`${fila.id}.fecha`, fila.fecha, 'Indica la fecha de la adición.')
    v.dinero(`${fila.id}.valor`, fila.valor, 'Ingresa el valor adicionado.', true)
  }
  if (p.otrasModificaciones.length > MAX_FILAS_MODIFICACION) e.otrasModificaciones = `Máximo ${MAX_FILAS_MODIFICACION} registros.`
  for (const fila of p.otrasModificaciones) {
    v.texto(`${fila.id}.numero`, fila.numero, 'Indica el número.', 10)
    v.fecha(`${fila.id}.fecha`, fila.fecha, 'Indica la fecha de la modificación.')
    v.texto(`${fila.id}.observaciones`, fila.observaciones, 'Describe la modificación.', 150)
  }
  v.fecha('fechaAprobacionPolizas', p.fechaAprobacionPolizas, '', false)
  return e
}

/** Datos exclusivos de esta acta (los únicos que se piden en la tarjeta del acta). */
export function validarActa(acta: DatosActa, perfil: PerfilContratista): Errores {
  const v = validador(true)
  const { e } = v
  const valores = calcularValores(acta, perfil)
  const terminacion = perfil.nuevaFechaTerminacion || perfil.fechaTerminacion

  v.patron('numeroActa', acta.numeroActa, 'Ingresa el número del acta.', CODIGO, 'Usa hasta 20 letras, números o guiones.')
  v.fecha('fechaActa', acta.fechaActa, 'Indica la fecha del acta.')
  v.texto('ciudad', acta.ciudad, 'Indica la ciudad donde se suscribe el acta.', 60)

  v.fecha('periodoDesde', acta.periodoDesde, 'Indica la fecha inicial del periodo de cobro.')
  v.fecha('periodoHasta', acta.periodoHasta, 'Indica la fecha final del periodo de cobro.')
  if (!e.periodoDesde && !e.periodoHasta) {
    if (acta.periodoHasta < acta.periodoDesde) e.periodoHasta = 'No puede ser anterior a la fecha inicial.'
    else if (perfil.fechaInicio && acta.periodoDesde < perfil.fechaInicio) e.periodoDesde = 'No puede ser anterior al inicio del contrato.'
    else if (terminacion && acta.periodoHasta > terminacion) e.periodoHasta = 'No puede ser posterior a la terminación del contrato.'
  }
  if (!e.fechaActa && !e.periodoHasta && acta.periodoHasta && acta.fechaActa < acta.periodoHasta) {
    e.fechaActa = 'No puede ser anterior al final del periodo de cobro.'
  }

  v.dinero('valorCobrar', acta.valorCobrar, 'Ingresa el valor a cobrar en este periodo.', true)
  if (!e.valorCobrar && valores.valorCobrar > valores.valorTotal) e.valorCobrar = 'No puede superar el valor total del contrato.'
  if (pideIva(perfil)) v.dinero('valorIva', acta.valorIva, 'Ingresa el valor del IVA de esta acta.', false)
  if (pideAmortizacion(perfil)) {
    v.dinero('valorAmortizar', acta.valorAmortizar, 'Ingresa el valor a amortizar del anticipo (0 si no corresponde en esta acta).', false)
    if (!e.valorAmortizar && valores.valorAmortizar > valores.anticipo) e.valorAmortizar = 'No puede superar el anticipo registrado en Mi perfil.'
    if (acta.porcentajeAmortizacion) {
      const p = Number(acta.porcentajeAmortizacion.replace(',', '.'))
      if (!/^\d{1,3}([.,]\d{1,2})?$/.test(acta.porcentajeAmortizacion) || p > 100) {
        e.porcentajeAmortizacion = 'Usa un porcentaje entre 0 y 100 (hasta 2 decimales).'
      }
    }
  }
  if (!e.valorAmortizar && !e.valorCobrar && !e.valorIva && valores.bruto < 0) {
    e.valorCobrar = 'El valor bruto a pagar quedaría negativo.'
  }
  if (acta.referenciaInforme.length > 150) e.referenciaInforme = 'Máximo 150 caracteres.'
  return e
}

export interface ContextoActa {
  perfil: PerfilContratista
  planilla: DatosPlanilla
  archivoPlanilla: EstadoValidacion
  estampillas: DatosEstampillas
  archivoEstampilla: EstadoValidacion
  /** Soportes individuales por estampilla (clave: id de la estampilla). */
  archivosEstampilla?: ArchivosEstampilla
  acta: DatosActa
  hoy?: string
}

/** Origen de cada pendiente; determina a qué apartado lleva el enlace. */
export type OrigenPendiente = 'perfil' | 'contrato' | 'planilla' | 'estampilla' | 'acta'

export interface Pendiente {
  id: OrigenPendiente
  titulo: string
  /** Mensajes concretos de lo que falta o debe corregirse. */
  detalles: string[]
}

/** Mensajes con contexto para las filas repetibles («Suspensión 1: …»). */
function conEtiquetas(errores: Errores, perfil: PerfilContratista): string[] {
  const etiquetas = new Map<string, string>()
  const listas = [
    [perfil.suspensiones, 'Suspensión'],
    [perfil.prorrogas, 'Prórroga'],
    [perfil.adiciones, 'Adición'],
    [perfil.otrasModificaciones, 'Otra modificación'],
  ] as const
  for (const [filas, nombre] of listas) filas.forEach((fila, i) => etiquetas.set(fila.id, `${nombre} ${i + 1}`))
  const mensajes = Object.entries(errores).map(([clave, mensaje]) => {
    const id = clave.includes('.') ? clave.split('.')[0] : ''
    return etiquetas.has(id) ? `${etiquetas.get(id)}: ${mensaje}` : mensaje
  })
  return [...new Set(mensajes)]
}

/** Datos contractuales por completar o corregir en la revisión de la minuta (con etiquetas de fila). */
export function faltantesRevisionContrato(perfil: PerfilContratista): string[] {
  return conEtiquetas(validarContratoActa(perfil, true), perfil)
}

/** Datos contractuales que faltan para el acta; exige además que el contratista los haya confirmado. */
export function faltantesContratoActa(perfil: PerfilContratista): string[] {
  const faltan = conEtiquetas(validarContratoActa(perfil, true), perfil)
  return perfil.contratoConfirmado ? faltan : ['Revisa la minuta y confirma los datos contractuales en Mi perfil.', ...faltan]
}

export function faltantesActa(acta: DatosActa, perfil: PerfilContratista): string[] {
  return [...new Set(Object.values(validarActa(acta, perfil)))]
}

/** Lo que falta para poder generar el acta, agrupado por origen. Vacío = se puede generar. */
export function pendientesActa(ctx: ContextoActa): Pendiente[] {
  const pendientes: Pendiente[] = []
  const perfil = faltantesPerfil(ctx.perfil)
  if (perfil.length) {
    pendientes.push({ id: 'perfil', titulo: 'Mi perfil · Datos básicos', detalles: perfil.map((c) => `Falta el dato «${c}».`) })
  }
  const contrato = faltantesContratoActa(ctx.perfil)
  if (contrato.length) pendientes.push({ id: 'contrato', titulo: 'Mi perfil · Datos contractuales (minuta)', detalles: contrato })
  const planilla = faltantesPlanilla(ctx.planilla, ctx.archivoPlanilla, ctx.hoy)
  if (planilla.length) pendientes.push({ id: 'planilla', titulo: 'Planilla de Seguridad Social', detalles: planilla })
  const estampillas = faltantesEstampillas(ctx.estampillas, ctx.archivoEstampilla, ctx.archivosEstampilla, ctx.hoy)
  if (estampillas.length) pendientes.push({ id: 'estampilla', titulo: 'Estampilla', detalles: estampillas })
  const acta = faltantesActa(ctx.acta, ctx.perfil)
  if (acta.length) pendientes.push({ id: 'acta', titulo: 'Datos de esta acta', detalles: acta })
  return pendientes
}

export const referenciaDeInforme = (i: Pick<InformeActividades, 'numero' | 'periodo'>) =>
  `Informe N.º ${i.numero} · ${etiquetaPeriodo(i.periodo)}`

/**
 * Reutiliza un informe de la sesión: copia su referencia y, solo si el periodo del acta está vacío,
 * sus fechas. Nunca reemplaza fechas que el contratista ya escribió.
 */
export function usarInforme(acta: DatosActa, informe: Pick<InformeActividades, 'numero' | 'periodo' | 'fechaInicio' | 'fechaFin'>): DatosActa {
  const periodoVacio = !acta.periodoDesde && !acta.periodoHasta
  return {
    ...acta,
    referenciaInforme: referenciaDeInforme(informe),
    ...(periodoVacio && FECHA_ISO.test(informe.fechaInicio) && FECHA_ISO.test(informe.fechaFin)
      ? { periodoDesde: informe.fechaInicio, periodoHasta: informe.fechaFin }
      : {}),
  }
}

/** Grupo de datos que el acta toma de otro apartado (se muestran en solo lectura). */
export interface GrupoReutilizado {
  id: Exclude<OrigenPendiente, 'acta'>
  titulo: string
  filas: [etiqueta: string, valor: string][]
  /** Aviso cuando el apartado aún no está listo (sin confirmar, no requerida…). */
  nota?: string
}

const SIN_REGISTRAR = 'Sin registrar'
const o = (valor: string) => valor.trim() || SIN_REGISTRAR
const fechaO = (iso: string) => (FECHA_ISO.test(iso) ? fechaActa(iso) : SIN_REGISTRAR)
const pesosO = (s: string) => (/^\d+$/.test(s) ? pesosActa(Number(s)) : SIN_REGISTRAR)
const periodoO = (p: string) => (p ? etiquetaPeriodo(p) : SIN_REGISTRAR)

/**
 * Resumen de los datos que el acta reutiliza, tal como están registrados en su apartado.
 * Es solo lectura: para cambiarlos se edita el apartado de origen (una única fuente de verdad).
 */
export function datosReutilizados(ctx: ContextoActa): GrupoReutilizado[] {
  const { perfil, planilla, estampillas } = ctx
  const terminacion = perfil.nuevaFechaTerminacion || perfil.fechaTerminacion
  const tipoId = perfil.tipoIdentificacion ? `${perfil.tipoIdentificacion} ` : ''
  return [
    {
      id: 'perfil',
      titulo: 'Mi perfil · Datos básicos',
      filas: [
        ['Contratista', o([perfil.nombres, perfil.apellidos].filter((s) => s.trim()).join(' '))],
        ['Identificación', perfil.numeroIdentificacion.trim() ? `${tipoId}${perfil.numeroIdentificacion.trim()}` : SIN_REGISTRAR],
        ['Contrato', o(perfil.numeroContrato)],
        ['Plazo', `${fechaO(perfil.fechaInicio)} – ${fechaO(terminacion)}`],
      ],
    },
    {
      id: 'contrato',
      titulo: 'Mi perfil · Datos contractuales',
      filas: [
        ['Entidad', o(perfil.entidadContratante)],
        ['Dependencia', o(perfil.dependenciaContrato)],
        ['Objeto', o(perfil.objetoContractual)],
        ['Valor del contrato', pesosO(perfil.valorContrato)],
        ['Supervisor', o(perfil.supervisorNombre)],
        ['CDP / RP', `${o(perfil.cdpNumero)} / ${o(perfil.rpNumero)}`],
      ],
      nota: perfil.contratoConfirmado ? undefined : 'Sin confirmar: el acta los usará cuando los confirmes en Mi perfil.',
    },
    {
      id: 'planilla',
      titulo: 'Planilla de Seguridad Social',
      filas: [
        ['Planilla', planilla.numeroPlanilla ? (planilla.planillaAdicional ? `${planilla.numeroPlanilla} / Adic. ${planilla.planillaAdicional}` : planilla.numeroPlanilla) : SIN_REGISTRAR],
        ['Periodo salud / pensión', `${periodoO(planilla.periodoSalud)} / ${periodoO(planilla.periodoPension)}`],
        ['Fecha de pago', fechaO(planilla.fechaPago)],
        ['IBC', pesosO(planilla.ibc)],
      ],
    },
    {
      id: 'estampilla',
      titulo: 'Estampillas',
      filas:
        estampillas.requerida === 'si'
          ? estampillas.items.map((s, i) => [`Estampilla ${i + 1}`, `${o(s.tipo)} · N.º ${o(s.numero)} · ${fechaO(s.fechaPago)} · ${pesosO(s.valor)}`])
          : [],
      nota:
        estampillas.requerida === 'no'
          ? 'Marcadas como «No requerida»: el acta indica que no aplican y no se exigen.'
          : estampillas.requerida === ''
            ? 'Aún no indicas si el contrato requiere estampillas.'
            : estampillas.items.length === 0
              ? 'No hay estampillas registradas.'
              : undefined,
    },
  ]
}

// ---------------------------------------------------------------------------
// Formato de los datos para el documento
// ---------------------------------------------------------------------------

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

/** Entero de 0 a 999 en letras. `apocope`: "un"/"veintiún" delante de un sustantivo (un mes, veintiún días). */
export function numeroALetras(n: number, apocope = false): string {
  if (!Number.isInteger(n) || n < 0 || n > 999) return String(n)
  const ajustar = (t: string) => (apocope ? t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un') : t)
  if (n < 30) return ajustar(UNIDADES[n])
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return ajustar(u ? `${DECENAS[d]} y ${UNIDADES[u]}` : DECENAS[d])
  }
  if (n === 100) return 'cien'
  const resto = n % 100
  return `${CENTENAS[Math.floor(n / 100)]}${resto ? ` ${numeroALetras(resto, apocope)}` : ''}`
}

/** '(6) SEIS MESES', '(1) UN MES Y (15) QUINCE DÍAS'. */
export function duracionEnLetras(inicio: string, fin: string): string {
  const d = calcularDuracion(inicio, fin)
  if (!d) return 'No disponible'
  const partes = []
  if (d.meses) partes.push(`(${d.meses}) ${numeroALetras(d.meses, true)} ${d.meses === 1 ? 'mes' : 'meses'}`)
  if (d.dias || !d.meses) partes.push(`(${d.dias}) ${numeroALetras(d.dias, true)} ${d.dias === 1 ? 'día' : 'días'}`)
  return partes.join(' y ').toLocaleUpperCase('es-CO')
}

const formatoPesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatoPorcentaje = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatoMesLargo = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

/** 5500000 → '$ 5.500.000,00' (espacios normales para el PDF). */
export function pesosActa(valor: number): string {
  return formatoPesos.format(valor).replace(/\s/g, ' ')
}

export function porcentajeActa(valor: number): string {
  return `${formatoPorcentaje.format(valor)} %`
}

/** 'AAAA-MM-DD' → 'DD/MM/AAAA'. */
export function fechaActa(iso: string): string {
  if (!FECHA_ISO.test(iso)) return 'No Aplica'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** 'AAAA-MM-DD' → '1 de junio de 2026'. */
export function fechaLargaActa(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return formatoMesLargo.format(new Date(y, m - 1, d))
}

const mayus = (s: string) => s.trim().toLocaleUpperCase('es-CO')
const NO_APLICA = 'No Aplica'

export interface ActaResuelta {
  dependencia: string
  numeroActa: string
  fechaActa: string
  contratoYFecha: string
  tipoContrato: string
  contratante: string
  entidad: string
  objeto: string
  contratista: { nombre: string; identificacion: string }
  representacionPropia: boolean
  representante: { nombre: string; identificacion: string }
  ordenador: { nombre: string; cargo: string; identificacion: string }
  supervisor: { nombre: string; identificacion: string }
  valorContrato: string
  valorAdicionado: string
  anticipo: string
  anticipoPorcentaje: string
  cdp: { numero: string; fecha: string }
  cdpAdicional: { numero: string; fecha: string }
  rp: { numero: string; fecha: string }
  rpAdicional: { numero: string; fecha: string }
  fechaInicio: string
  fechaFinalizacion: string
  nuevaFechaTerminacion: string
  duracion: string
  suspensiones: { numero: string; tiempo: string; fechaInicial: string; fechaFinal: string }[]
  prorrogas: { numero: string; tiempo: string; fechaInicial: string; fechaFinal: string }[]
  adiciones: { numero: string; fecha: string; valor: string; valorTotal: string }[]
  otrasModificaciones: { numero: string; fecha: string; observaciones: string }[]
  fechaAprobacionPolizas: string
  periodoDesde: string
  periodoHasta: string
  valorCobrar: string
  porcentajeAmortizacion: string
  valorAmortizar: string
  seguridadSocial: {
    periodo: string
    fechaPago: string
    planilla: string
    ibc: string
    eps: string
    fondoPensiones: string
    arl: string
    valorSalud: string
    valorPension: string
    valorArl: string
  }
  valores: { ejecutado: string; iva: string; amortizacion: string; bruto: string }
  /** `null` cuando el contratista indicó que no se requieren estampillas. */
  estampillas: { tipo: string; numero: string; fechaPago: string; valor: string }[] | null
  ciudad: string
  fechaLarga: string
  referenciaInforme: string
}

/** Convierte los datos ingresados en los textos del documento. Solo debe llamarse sin pendientes. */
export function resolverActa(ctx: ContextoActa): ActaResuelta {
  const { perfil, planilla, estampillas, acta } = ctx
  const v = calcularValores(acta, perfil)
  const entidad = mayus(perfil.entidadContratante)
  const opcional = (valor: string, vacio = 'No registrado') => (valor ? pesosActa(Number(valor)) : vacio)

  let acumulado = v.valorContrato
  return {
    dependencia: mayus(perfil.dependenciaContrato),
    numeroActa: acta.numeroActa.trim(),
    fechaActa: fechaActa(acta.fechaActa),
    contratoYFecha: `${perfil.numeroContrato.trim()} - ${fechaActa(perfil.fechaContrato)}`,
    tipoContrato: mayus(perfil.tipoContrato),
    contratante: perfil.nitContratante ? `${entidad} NIT ${perfil.nitContratante}` : entidad,
    entidad,
    objeto: mayus(perfil.objetoContractual),
    contratista: { nombre: mayus(perfil.nombreCompleto), identificacion: perfil.numeroIdentificacion.trim() },
    representacionPropia: perfil.representacion === 'propia',
    representante:
      perfil.representacion === 'propia'
        ? { nombre: mayus(perfil.nombreCompleto), identificacion: perfil.numeroIdentificacion.trim() }
        : { nombre: mayus(perfil.representanteNombre), identificacion: perfil.representanteIdentificacion.trim() },
    ordenador: {
      nombre: mayus(perfil.ordenadorNombre),
      cargo: perfil.ordenadorCargo.trim(),
      identificacion: perfil.ordenadorIdentificacion.trim(),
    },
    supervisor: { nombre: mayus(perfil.supervisorNombre), identificacion: perfil.supervisorIdentificacion.trim() },
    valorContrato: pesosActa(v.valorContrato),
    valorAdicionado: pesosActa(v.valorAdicionado),
    anticipo: pesosActa(v.anticipo),
    anticipoPorcentaje: porcentajeActa(v.anticipoPorcentaje),
    cdp: { numero: perfil.cdpNumero.trim(), fecha: fechaActa(perfil.cdpFecha) },
    cdpAdicional: perfil.cdpAdicionalAplica
      ? { numero: perfil.cdpAdicionalNumero.trim(), fecha: fechaActa(perfil.cdpAdicionalFecha) }
      : { numero: NO_APLICA, fecha: NO_APLICA },
    rp: { numero: perfil.rpNumero.trim(), fecha: fechaActa(perfil.rpFecha) },
    rpAdicional: perfil.rpAdicionalAplica
      ? { numero: perfil.rpAdicionalNumero.trim(), fecha: fechaActa(perfil.rpAdicionalFecha) }
      : { numero: NO_APLICA, fecha: NO_APLICA },
    fechaInicio: fechaActa(perfil.fechaInicio),
    fechaFinalizacion: fechaActa(perfil.fechaTerminacion),
    nuevaFechaTerminacion: perfil.nuevaFechaTerminacion ? fechaActa(perfil.nuevaFechaTerminacion) : NO_APLICA,
    duracion: duracionEnLetras(perfil.fechaInicio, perfil.fechaTerminacion),
    suspensiones: perfil.suspensiones.map((f) => ({ numero: f.numero.trim(), tiempo: f.tiempo.trim(), fechaInicial: fechaActa(f.fechaInicial), fechaFinal: fechaActa(f.fechaFinal) })),
    prorrogas: perfil.prorrogas.map((f) => ({ numero: f.numero.trim(), tiempo: f.tiempo.trim(), fechaInicial: fechaActa(f.fechaInicial), fechaFinal: fechaActa(f.fechaFinal) })),
    adiciones: perfil.adiciones.map((f) => {
      acumulado += Number(f.valor)
      return { numero: f.numero.trim(), fecha: fechaActa(f.fecha), valor: pesosActa(Number(f.valor)), valorTotal: pesosActa(acumulado) }
    }),
    otrasModificaciones: perfil.otrasModificaciones.map((f) => ({ numero: f.numero.trim(), fecha: fechaActa(f.fecha), observaciones: f.observaciones.trim() })),
    fechaAprobacionPolizas: perfil.fechaAprobacionPolizas ? fechaActa(perfil.fechaAprobacionPolizas) : NO_APLICA,
    periodoDesde: fechaActa(acta.periodoDesde),
    periodoHasta: fechaActa(acta.periodoHasta),
    valorCobrar: pesosActa(v.valorCobrar),
    porcentajeAmortizacion: pideAmortizacion(perfil) && acta.porcentajeAmortizacion ? porcentajeActa(Number(acta.porcentajeAmortizacion.replace(',', '.'))) : '',
    valorAmortizar: pesosActa(v.valorAmortizar),
    seguridadSocial: {
      periodo:
        planilla.periodoSalud === planilla.periodoPension
          ? etiquetaPeriodo(planilla.periodoSalud)
          : `Salud: ${etiquetaPeriodo(planilla.periodoSalud)} / Pensión: ${etiquetaPeriodo(planilla.periodoPension)}`,
      fechaPago: fechaActa(planilla.fechaPago),
      planilla: planilla.planillaAdicional ? `${planilla.numeroPlanilla} / Adic. ${planilla.planillaAdicional}` : planilla.numeroPlanilla,
      ibc: pesosActa(Number(planilla.ibc)),
      eps: mayus(planilla.eps) || 'No registrada',
      fondoPensiones: mayus(planilla.fondoPensiones) || 'No registrado',
      arl: mayus(planilla.arl) || 'No registrada',
      valorSalud: opcional(planilla.valorSalud),
      valorPension: opcional(planilla.valorPension),
      valorArl: opcional(planilla.valorArl),
    },
    valores: {
      ejecutado: pesosActa(v.valorCobrar),
      iva: pesosActa(v.valorIva),
      amortizacion: pesosActa(v.valorAmortizar),
      bruto: pesosActa(v.bruto),
    },
    estampillas:
      estampillas.requerida === 'no'
        ? null
        : estampillas.items.map((s) => ({ tipo: mayus(s.tipo), numero: s.numero.trim(), fechaPago: fechaActa(s.fechaPago), valor: pesosActa(Number(s.valor)) })),
    ciudad: acta.ciudad.trim(),
    fechaLarga: fechaLargaActa(acta.fechaActa),
    referenciaInforme: acta.referenciaInforme.trim(),
  }
}
