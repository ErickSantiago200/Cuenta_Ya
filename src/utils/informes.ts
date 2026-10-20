import type { ActividadInforme, DatosInforme } from '../types'

export const MAX_DESCRIPCION = 1000
export const MAX_RESULTADO = 500
export const MAX_OBSERVACIONES = 2000

/** 'AAAA-MM' con mes 01–12. Algunos navegadores muestran <input type="month"> como texto libre. */
export const PERIODO_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/

/** Convierte 'AAAA-MM-DD' en una fecha local (sin desfase de zona horaria). */
function fechaLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' })
const formatoFechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
const formatoMes = new Intl.DateTimeFormat('es-CO', { month: 'long' })

export function formatearFecha(iso: string): string {
  return iso ? formatoFecha.format(fechaLocal(iso)) : '—'
}

export function formatearFechaHora(fecha: Date): string {
  return formatoFechaHora.format(fecha)
}

/** 'AAAA-MM' → 'Marzo 2026'. */
export function etiquetaPeriodo(periodo: string): string {
  if (!PERIODO_VALIDO.test(periodo)) return 'Sin periodo'
  const [y, m] = periodo.split('-').map(Number)
  const mes = formatoMes.format(new Date(y, m - 1, 1))
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`
}

/** Primer y último día del mes 'AAAA-MM', como sugerencia editable para las fechas del periodo. */
export function rangoDelMes(periodo: string): { inicio: string; fin: string } {
  const [y, m] = periodo.split('-').map(Number)
  const ultimoDia = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return { inicio: `${y}-${mm}-01`, fin: `${y}-${mm}-${String(ultimoDia).padStart(2, '0')}` }
}

export function nuevaActividad(): ActividadInforme {
  return { id: crypto.randomUUID(), descripcion: '', obligacionId: '', resultado: '' }
}

export function datosVacios(): DatosInforme {
  return { periodo: '', fechaInicio: '', fechaFin: '', actividades: [nuevaActividad()], observaciones: '' }
}

/** Claves de error: 'periodo', 'fechaInicio', 'fechaFin', 'actividades', 'observaciones', `${idActividad}.descripcion`, `${idActividad}.resultado`. */
export type ErroresInforme = Record<string, string>

/**
 * Campos obligatorios (preliminares): periodo, fechas válidas, al menos una actividad
 * con descripción y resultado. La obligación contractual es opcional mientras no exista el módulo Contrato.
 */
export function validarInforme(datos: DatosInforme): ErroresInforme {
  const errores: ErroresInforme = {}

  if (!datos.periodo) errores.periodo = 'Selecciona el mes del periodo del informe.'
  else if (!PERIODO_VALIDO.test(datos.periodo)) errores.periodo = 'Usa el formato AAAA-MM, por ejemplo 2026-03.'
  if (!datos.fechaInicio) errores.fechaInicio = 'Indica la fecha de inicio del periodo.'
  if (!datos.fechaFin) errores.fechaFin = 'Indica la fecha de finalización del periodo.'
  if (datos.fechaInicio && datos.fechaFin && datos.fechaFin < datos.fechaInicio) {
    errores.fechaFin = 'La fecha de finalización no puede ser anterior a la de inicio.'
  }

  if (datos.actividades.length === 0) {
    errores.actividades = 'Agrega al menos una actividad realizada.'
  }
  for (const actividad of datos.actividades) {
    const descripcion = actividad.descripcion.trim()
    const resultado = actividad.resultado.trim()
    if (!descripcion) errores[`${actividad.id}.descripcion`] = 'Describe la actividad realizada.'
    else if (descripcion.length > MAX_DESCRIPCION)
      errores[`${actividad.id}.descripcion`] = `Máximo ${MAX_DESCRIPCION} caracteres.`
    if (!resultado) errores[`${actividad.id}.resultado`] = 'Indica el resultado o producto obtenido.'
    else if (resultado.length > MAX_RESULTADO)
      errores[`${actividad.id}.resultado`] = `Máximo ${MAX_RESULTADO} caracteres.`
  }

  if (datos.observaciones.length > MAX_OBSERVACIONES) {
    errores.observaciones = `Máximo ${MAX_OBSERVACIONES} caracteres.`
  }
  return errores
}

/** Quita espacios sobrantes antes de crear o actualizar el borrador. */
export function normalizarDatos(datos: DatosInforme): DatosInforme {
  return {
    ...datos,
    observaciones: datos.observaciones.trim(),
    actividades: datos.actividades.map((a) => ({
      ...a,
      descripcion: a.descripcion.trim(),
      resultado: a.resultado.trim(),
    })),
  }
}
