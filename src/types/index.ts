import type { LucideIcon } from 'lucide-react'

/** Estados preliminares del flujo de informes (pendiente de validación funcional). */
export type EstadoInforme = 'Borrador' | 'Enviado' | 'En revisión' | 'Requiere ajustes' | 'Aprobado'

/** Fila del resumen del panel principal (datos de demostración). `Pendiente`: periodo sin informe. */
export interface ResumenInforme {
  id: number
  numero: number
  periodo: string
  fechaEnvio: string | null
  valor: string
  estado: EstadoInforme | 'Pendiente'
}

export interface ObligacionContractual {
  id: string
  texto: string
}

export interface ActividadInforme {
  id: string
  descripcion: string
  /** Id de la obligación relacionada; cadena vacía = sin seleccionar. */
  obligacionId: string
  resultado: string
}

/** Campos editables de un informe de actividades. */
export interface DatosInforme {
  /** Mes del periodo en formato AAAA-MM. */
  periodo: string
  /** Fechas en formato AAAA-MM-DD. */
  fechaInicio: string
  fechaFin: string
  actividades: ActividadInforme[]
  observaciones: string
}

export interface InformeActividades extends DatosInforme {
  id: string
  /** Número consecutivo de la sesión; `null` en los ejemplos de demostración. */
  numero: number | null
  estado: EstadoInforme
  actualizado: Date
  /** Ejemplo visual: no corresponde a un informe real y no se puede editar. */
  esDemo: boolean
}

export interface Indicador {
  id: string
  titulo: string
  valor: string
  detalle: string
  icono: LucideIcon
}

export interface ItemMenu {
  id: string
  etiqueta: string
  icono: LucideIcon
  /** Ruta del módulo; si falta, el módulo aún no está implementado. */
  ruta?: string
}
