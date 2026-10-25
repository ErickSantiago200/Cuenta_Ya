import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { ArchivoAnexo } from '../cuenta/CuentaCobroContext'
import type { ArchivoValidado } from '../hooks/useValidacionAnexo'
import type { PerfilContratista } from '../types'

export interface PerfilContextValue {
  /** Datos aplicados/confirmados en esta sesión (solo en memoria): los usan el panel y el acta. */
  perfil: PerfilContratista
  /**
   * Aplica solo los campos indicados (p. ej. los datos básicos o los contractuales confirmados),
   * sin tocar los cambios en curso de otras secciones.
   */
  aplicarCampos: (campos: Partial<PerfilContratista>) => void
  /**
   * Cambios en curso del formulario Mi perfil. Viven en el estado compartido para que no se pierdan
   * al navegar a otra sección antes de guardarlos o confirmarlos.
   */
  borrador: PerfilContratista
  setBorrador: Dispatch<SetStateAction<PerfilContratista>>
  /** Minuta del contrato: validada localmente, no se sube ni se guarda, y su contenido no se lee. */
  minuta: ArchivoAnexo
  /** Firma seleccionada y validada localmente; no se sube ni se aplica a documentos. */
  firma: ArchivoValidado | null
  setFirma: (firma: ArchivoValidado | null) => void
}

export const PerfilContext = createContext<PerfilContextValue | null>(null)

export function usePerfil(): PerfilContextValue {
  const context = useContext(PerfilContext)
  if (!context) {
    throw new Error('usePerfil debe usarse dentro de <PerfilProvider>')
  }
  return context
}
