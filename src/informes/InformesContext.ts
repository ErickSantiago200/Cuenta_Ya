import { createContext, useContext } from 'react'
import type { DatosInforme, InformeActividades } from '../types'

export interface InformesContextValue {
  /** Borradores creados en esta sesión (solo en memoria). */
  informes: InformeActividades[]
  /** Ejemplos de demostración de solo lectura. */
  demos: InformeActividades[]
  mostrarDemos: boolean
  setMostrarDemos: (mostrar: boolean) => void
  obtener: (id: string) => InformeActividades | undefined
  crearBorrador: (datos: DatosInforme) => InformeActividades
  /** Solo actualiza informes propios en estado Borrador; devuelve `false` en otro caso. */
  actualizarBorrador: (id: string, datos: DatosInforme) => boolean
}

export const InformesContext = createContext<InformesContextValue | null>(null)

export function useInformes(): InformesContextValue {
  const context = useContext(InformesContext)
  if (!context) {
    throw new Error('useInformes debe usarse dentro de <InformesProvider>')
  }
  return context
}
