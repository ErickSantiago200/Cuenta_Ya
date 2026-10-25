import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { TipoAnexo } from '../data/anexos'
import type { EstadoValidacion } from '../hooks/useValidacionAnexo'
import type { DatosActa, DatosEstampillas, DatosPlanilla } from '../types'
import type { ArchivosEstampilla } from '../utils/soportes'

export interface ArchivoAnexo {
  estado: EstadoValidacion
  seleccionar: (file: File) => Promise<void>
  quitar: () => void
}

/** PDF del acta generado en el navegador (URL local tipo blob:, nunca se sube). */
export interface ActaGenerada {
  url: string
  nombreArchivo: string
  generadaEn: Date
  bloquesMovidos: number
  /** Huella de los datos usados: si cambian, el PDF deja de corresponder y debe regenerarse. */
  firmaDatos: string
}

/** Soportes y datos de la cuenta de cobro en preparación (solo en memoria durante la sesión). */
export interface CuentaCobroContextValue {
  archivos: Record<TipoAnexo, ArchivoAnexo>
  planilla: DatosPlanilla
  setPlanilla: Dispatch<SetStateAction<DatosPlanilla>>
  estampillas: DatosEstampillas
  setEstampillas: Dispatch<SetStateAction<DatosEstampillas>>
  /** Soporte individual de cada estampilla. */
  archivosEstampilla: ArchivosEstampilla
  seleccionarArchivoEstampilla: (id: string, file: File) => Promise<void>
  quitarArchivosEstampilla: (ids: string[]) => void
  acta: DatosActa
  setActa: Dispatch<SetStateAction<DatosActa>>
  actaGenerada: ActaGenerada | null
  setActaGenerada: (acta: ActaGenerada | null) => void
}

export const CuentaCobroContext = createContext<CuentaCobroContextValue | null>(null)

export function useCuentaCobro(): CuentaCobroContextValue {
  const context = useContext(CuentaCobroContext)
  if (!context) {
    throw new Error('useCuentaCobro debe usarse dentro de <CuentaCobroProvider>')
  }
  return context
}
