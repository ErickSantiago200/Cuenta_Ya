import type { EstadoValidacion } from '../hooks/useValidacionAnexo'
import type { DatosEstampillas, DatosPlanilla, Estampilla } from '../types'
import { PERIODO_VALIDO } from './informes'

/**
 * Estado de un requisito de la cuenta de cobro.
 * - pendiente: faltan datos o el soporte requerido.
 * - completo: datos obligatorios y archivo con formato válido presentes (no implica revisión del contenido).
 * - no-requerida: el contratista indicó que no aplica (solo estampilla).
 * - verificado: reservado para una comprobación real; hoy ninguna función lo otorga.
 */
export type EstadoRequisito = 'pendiente' | 'completo' | 'no-requerida' | 'verificado'

/** Claves: nombre del campo, o `${id}.campo` para filas repetibles; 'general' para errores de la sección. */
export type Errores = Record<string, string>

export const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/
export const MAX_ESTAMPILLAS = 6

/** Fecha local de hoy en AAAA-MM-DD. */
export function hoyISO(fecha = new Date()): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mm}-${dd}`
}

export function planillaVacia(): DatosPlanilla {
  return {
    numeroPlanilla: '',
    periodoSalud: '',
    periodoPension: '',
    fechaPago: '',
    planillaAdicional: '',
    ibc: '',
    valorSalud: '',
    valorPension: '',
    valorArl: '',
    eps: '',
    fondoPensiones: '',
    arl: '',
  }
}

export function estampillasVacias(): DatosEstampillas {
  return { requerida: '', items: [] }
}

export function nuevaEstampilla(): Estampilla {
  return { id: crypto.randomUUID(), tipo: '', numero: '', fechaPago: '', valor: '' }
}

/** Valida una fecha obligatoria que no puede estar en el futuro. */
function fechaPasada(valor: string, etiqueta: string, hoy: string): string | undefined {
  if (!valor) return `Indica ${etiqueta}.`
  if (!FECHA_ISO.test(valor)) return 'Usa una fecha válida.'
  if (valor > hoy) return 'La fecha no puede ser posterior a hoy.'
}

/** Pesos sin decimales: dígitos; `positivo` exige > 0. */
function validarPesos(valor: string, { obligatorio, positivo }: { obligatorio: boolean; positivo: boolean }, etiqueta: string) {
  if (!valor) return obligatorio ? `Ingresa ${etiqueta}.` : undefined
  if (!/^\d+$/.test(valor)) return 'Usa solo números, sin puntos ni signos.'
  if (positivo && Number(valor) <= 0) return 'El valor debe ser mayor que cero.'
}

export function validarPlanilla(p: DatosPlanilla, hoy = hoyISO()): Errores {
  const e: Errores = {}
  if (!p.numeroPlanilla) e.numeroPlanilla = 'Ingresa el número de la planilla.'
  else if (!/^\d{5,20}$/.test(p.numeroPlanilla)) e.numeroPlanilla = 'Usa solo números (entre 5 y 20 dígitos).'

  for (const [campo, etiqueta] of [['periodoSalud', 'salud'], ['periodoPension', 'pensión']] as const) {
    if (!p[campo]) e[campo] = `Indica el periodo de cotización de ${etiqueta}.`
    else if (!PERIODO_VALIDO.test(p[campo])) e[campo] = 'Usa el formato AAAA-MM, por ejemplo 2026-05.'
  }

  const errorFecha = fechaPasada(p.fechaPago, 'la fecha de pago', hoy)
  if (errorFecha) e.fechaPago = errorFecha

  if (p.planillaAdicional && !/^\d{5,20}$/.test(p.planillaAdicional)) {
    e.planillaAdicional = 'Usa solo números (entre 5 y 20 dígitos).'
  }
  if (p.planillaAdicional && p.planillaAdicional === p.numeroPlanilla) {
    e.planillaAdicional = 'La planilla adicional debe ser distinta de la principal.'
  }

  const errorIbc = validarPesos(p.ibc, { obligatorio: true, positivo: true }, 'el ingreso base de cotización')
  if (errorIbc) e.ibc = errorIbc

  for (const campo of ['valorSalud', 'valorPension', 'valorArl'] as const) {
    const error = validarPesos(p[campo], { obligatorio: false, positivo: false }, '')
    if (error) e[campo] = error
  }

  for (const campo of ['eps', 'fondoPensiones', 'arl'] as const) {
    if (p[campo].length > 120) e[campo] = 'Máximo 120 caracteres.'
  }
  return e
}

export function validarEstampillas(d: DatosEstampillas, hoy = hoyISO()): Errores {
  const e: Errores = {}
  if (!d.requerida) {
    e.requerida = 'Indica si el contrato requiere estampillas.'
    return e
  }
  if (d.requerida === 'no') return e
  if (d.items.length === 0) e.general = 'Agrega al menos una estampilla o márcala como «No requerida».'
  if (d.items.length > MAX_ESTAMPILLAS) e.general = `Máximo ${MAX_ESTAMPILLAS} estampillas por acta.`

  const numeros = new Set<string>()
  for (const item of d.items) {
    if (!item.tipo.trim()) e[`${item.id}.tipo`] = 'Indica el tipo de estampilla.'
    else if (item.tipo.length > 60) e[`${item.id}.tipo`] = 'Máximo 60 caracteres.'

    const numero = item.numero.trim()
    if (!numero) e[`${item.id}.numero`] = 'Indica el número de la estampilla.'
    else if (!/^[A-Za-z0-9-]{3,30}$/.test(numero)) e[`${item.id}.numero`] = 'Usa entre 3 y 30 letras, números o guiones.'
    else if (numeros.has(numero)) e[`${item.id}.numero`] = 'Este número de estampilla ya está registrado.'
    numeros.add(numero)

    const errorFecha = fechaPasada(item.fechaPago, 'la fecha de pago', hoy)
    if (errorFecha) e[`${item.id}.fechaPago`] = errorFecha

    const errorValor = validarPesos(item.valor, { obligatorio: true, positivo: true }, 'el valor')
    if (errorValor) e[`${item.id}.valor`] = errorValor
  }
  return e
}

const archivoValido = (archivo: EstadoValidacion | undefined) => archivo?.fase === 'valido'

/** Soportes por estampilla (clave: id de la estampilla). */
export type ArchivosEstampilla = Record<string, EstadoValidacion>

const unicos = (mensajes: string[]) => [...new Set(mensajes)]

/** Datos de la planilla que faltan o deben corregirse, más el soporte si no hay archivo válido. */
export function faltantesPlanilla(datos: DatosPlanilla, archivo: EstadoValidacion, hoy = hoyISO()): string[] {
  const faltan = unicos(Object.values(validarPlanilla(datos, hoy)))
  if (!archivoValido(archivo)) faltan.push('Adjunta el soporte de la planilla (PDF, DOC o DOCX).')
  return faltan
}

/**
 * Una estampilla tiene soporte si tiene su propio archivo válido o si existe un soporte general válido
 * en la tarjeta (por ejemplo, un único PDF con todas las estampillas).
 */
export function faltantesEstampillas(
  datos: DatosEstampillas,
  archivoGeneral: EstadoValidacion,
  archivosItems: ArchivosEstampilla = {},
  hoy = hoyISO(),
): string[] {
  if (datos.requerida === 'no') return []
  if (datos.requerida === '') return ['Indica si el contrato requiere estampillas o márcala como «No requerida».']
  const errores = validarEstampillas(datos, hoy)
  const faltan: string[] = []
  if (errores.general) faltan.push(errores.general)
  datos.items.forEach((item, i) => {
    for (const campo of ['tipo', 'numero', 'fechaPago', 'valor']) {
      const error = errores[`${item.id}.${campo}`]
      if (error) faltan.push(`Estampilla ${i + 1}: ${error}`)
    }
    if (!archivoValido(archivosItems[item.id]) && !archivoValido(archivoGeneral)) {
      faltan.push(`Estampilla ${i + 1}: adjunta su soporte o un soporte general en la tarjeta.`)
    }
  })
  return faltan
}

export function estadoPlanilla(datos: DatosPlanilla, archivo: EstadoValidacion, hoy = hoyISO()): EstadoRequisito {
  return faltantesPlanilla(datos, archivo, hoy).length === 0 ? 'completo' : 'pendiente'
}

export function estadoEstampillas(
  datos: DatosEstampillas,
  archivoGeneral: EstadoValidacion,
  archivosItems: ArchivosEstampilla = {},
  hoy = hoyISO(),
): EstadoRequisito {
  if (datos.requerida === 'no') return 'no-requerida'
  return faltantesEstampillas(datos, archivoGeneral, archivosItems, hoy).length === 0 ? 'completo' : 'pendiente'
}

/** Soportes que por ahora solo tienen archivo (sin datos que capturar). */
export function estadoSoloArchivo(archivo: EstadoValidacion): EstadoRequisito {
  return archivoValido(archivo) ? 'completo' : 'pendiente'
}
