import type { CampoTextoPerfil, PerfilContratista } from '../types'

/**
 * Propone nombres y apellidos a partir del nombre de la cuenta solo cuando la separación no es ambigua
 * (2 o 4 palabras); en otro caso deja todo en «nombres» para que el contratista lo separe.
 */
export function separarNombre(completo = ''): { nombres: string; apellidos: string } {
  const partes = completo.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 2 || partes.length === 4) {
    const mitad = partes.length / 2
    return { nombres: partes.slice(0, mitad).join(' '), apellidos: partes.slice(mitad).join(' ') }
  }
  return { nombres: partes.join(' '), apellidos: '' }
}

export function perfilInicial(datos: { nombre?: string; email?: string } = {}): PerfilContratista {
  return {
    ...separarNombre(datos.nombre),
    nombreCompleto: datos.nombre ?? '',
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    correo: datos.email ?? '',
    telefono: '',
    dependenciaPersonal: '',
    numeroContrato: '',
    vigencia: '',
    entidadContratante: '',
    dependenciaContrato: '',
    objetoContractual: '',
    valorContrato: '',
    fechaInicio: '',
    fechaTerminacion: '',
    tipoContrato: '',
    fechaContrato: '',
    nitContratante: '',
    representacion: 'propia',
    representanteNombre: '',
    representanteIdentificacion: '',
    ordenadorNombre: '',
    ordenadorCargo: '',
    ordenadorIdentificacion: '',
    supervisorNombre: '',
    supervisorIdentificacion: '',
    anticipo: '',
    responsableIva: '',
    cdpNumero: '',
    cdpFecha: '',
    cdpAdicionalAplica: false,
    cdpAdicionalNumero: '',
    cdpAdicionalFecha: '',
    rpNumero: '',
    rpFecha: '',
    rpAdicionalAplica: false,
    rpAdicionalNumero: '',
    rpAdicionalFecha: '',
    nuevaFechaTerminacion: '',
    suspensiones: [],
    prorrogas: [],
    adiciones: [],
    otrasModificaciones: [],
    fechaAprobacionPolizas: '',
    contratoConfirmado: false,
  }
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/
const DIA_MS = 24 * 60 * 60 * 1000

/** 'AAAA-MM-DD' → instante UTC (evita desfases por zona horaria). */
function utc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Suma meses conservando el día; si el mes destino es más corto, usa su último día (31 ene + 1 mes = 28/29 feb). */
function sumarMeses(iso: string, meses: number): number {
  const [y, m, d] = iso.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(y, m - 1 + meses + 1, 0)).getUTCDate()
  return Date.UTC(y, m - 1 + meses, Math.min(d, ultimoDia))
}

export interface Duracion {
  meses: number
  dias: number
  /** Días calendario, incluyendo el día de terminación. */
  totalDias: number
}

/**
 * Duración calendario entre dos fechas, contando el día de terminación
 * (1 feb – 31 jul = 6 meses). Devuelve `null` si las fechas faltan o son incoherentes.
 * La convención (calendario vs. comercial de 30 días) está pendiente de confirmación.
 */
export function calcularDuracion(inicio: string, fin: string): Duracion | null {
  if (!FECHA_ISO.test(inicio) || !FECHA_ISO.test(fin) || fin < inicio) return null
  const finExclusivo = utc(fin) + DIA_MS
  let meses = 0
  while (sumarMeses(inicio, meses + 1) <= finExclusivo) meses++
  const dias = Math.round((finExclusivo - sumarMeses(inicio, meses)) / DIA_MS)
  const totalDias = Math.round((finExclusivo - utc(inicio)) / DIA_MS)
  return { meses, dias, totalDias }
}

export function describirDuracion({ meses, dias }: Duracion): string {
  const partes = []
  if (meses) partes.push(`${meses} ${meses === 1 ? 'mes' : 'meses'}`)
  if (dias || !meses) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`)
  return partes.join(' y ')
}

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** '24000000' → '$ 24.000.000'. */
export function formatearCOP(digitos: string): string {
  return formatoCOP.format(Number(digitos))
}

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export type ErroresPerfil = Partial<Record<CampoTextoPerfil, string>>

/** Datos básicos que el contratista registra manualmente en Mi perfil. */
export const CAMPOS_BASICOS = [
  'nombres',
  'apellidos',
  'numeroIdentificacion',
  'numeroContrato',
  'fechaInicio',
  'fechaTerminacion',
] as const satisfies readonly CampoTextoPerfil[]

/**
 * Datos contractuales adicionales que se revisan a partir de la minuta y se confirman antes de usarse.
 * (Los datos básicos —contrato y fechas— se registran aparte.)
 */
export const CAMPOS_CONTRATO = [
  'entidadContratante',
  'dependenciaContrato',
  'objetoContractual',
  'valorContrato',
  'vigencia',
  'tipoContrato',
  'fechaContrato',
  'nitContratante',
  'representacion',
  'representanteNombre',
  'representanteIdentificacion',
  'ordenadorNombre',
  'ordenadorCargo',
  'ordenadorIdentificacion',
  'supervisorNombre',
  'supervisorIdentificacion',
  'anticipo',
  'responsableIva',
  'cdpNumero',
  'cdpFecha',
  'cdpAdicionalAplica',
  'cdpAdicionalNumero',
  'cdpAdicionalFecha',
  'rpNumero',
  'rpFecha',
  'rpAdicionalAplica',
  'rpAdicionalNumero',
  'rpAdicionalFecha',
  'nuevaFechaTerminacion',
  'suspensiones',
  'prorrogas',
  'adiciones',
  'otrasModificaciones',
  'fechaAprobacionPolizas',
] as const satisfies readonly (keyof PerfilContratista)[]

/** Copia solo los campos indicados (para aplicar o comparar una sección sin tocar las demás). */
export function tomarCampos<K extends keyof PerfilContratista>(p: PerfilContratista, campos: readonly K[]): Pick<PerfilContratista, K> {
  return Object.fromEntries(campos.map((c) => [c, p[c]])) as Pick<PerfilContratista, K>
}

export function mismosCampos(a: PerfilContratista, b: PerfilContratista, campos: readonly (keyof PerfilContratista)[]): boolean {
  return JSON.stringify(tomarCampos(a, campos)) === JSON.stringify(tomarCampos(b, campos))
}

const MENSAJE_OBLIGATORIO: Record<(typeof CAMPOS_BASICOS)[number], string> = {
  nombres: 'Ingresa tu nombre.',
  apellidos: 'Ingresa tu apellido.',
  numeroIdentificacion: 'Ingresa el número de identificación.',
  numeroContrato: 'Ingresa el número del contrato.',
  fechaInicio: 'Indica la fecha de inicio del contrato.',
  fechaTerminacion: 'Indica la fecha de finalización del contrato.',
}

/** Valida los datos básicos de Mi perfil. Los contractuales se validan en la revisión de la minuta. */
export function validarPerfil(p: PerfilContratista): ErroresPerfil {
  const errores: ErroresPerfil = {}

  for (const campo of CAMPOS_BASICOS) {
    if (!p[campo].trim()) errores[campo] = MENSAJE_OBLIGATORIO[campo]
  }
  for (const campo of ['nombres', 'apellidos'] as const) {
    if (p[campo].length > 80) errores[campo] = 'Máximo 80 caracteres.'
  }

  const id = p.numeroIdentificacion.trim()
  if (id && !/^[A-Za-z0-9]{3,20}$/.test(id)) {
    errores.numeroIdentificacion = 'Usa entre 3 y 20 números o letras, sin puntos ni espacios.'
  }
  if (p.numeroContrato.length > 40) errores.numeroContrato = 'Máximo 40 caracteres.'
  for (const campo of ['fechaInicio', 'fechaTerminacion'] as const) {
    if (p[campo] && !FECHA_ISO.test(p[campo])) errores[campo] = 'Usa una fecha válida.'
  }
  if (!errores.fechaInicio && !errores.fechaTerminacion && p.fechaInicio && p.fechaTerminacion && p.fechaTerminacion < p.fechaInicio) {
    errores.fechaTerminacion = 'La fecha de finalización no puede ser anterior a la de inicio.'
  }
  return errores
}

/** Quita espacios sobrantes (también en las listas) y recalcula el nombre completo. */
export function normalizarPerfil(p: PerfilContratista): PerfilContratista {
  const recortar = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as T
  const limpio = recortar(p)
  const nombreCompleto = [limpio.nombres, limpio.apellidos].filter(Boolean).join(' ') || limpio.nombreCompleto
  return {
    ...limpio,
    nombreCompleto,
    suspensiones: p.suspensiones.map(recortar),
    prorrogas: p.prorrogas.map(recortar),
    adiciones: p.adiciones.map(recortar),
    otrasModificaciones: p.otrasModificaciones.map(recortar),
  }
}
