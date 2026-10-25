import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useValidacionAnexo, type ArchivoValidado } from '../hooks/useValidacionAnexo'
import type { PerfilContratista } from '../types'
import { normalizarPerfil, perfilInicial } from '../utils/perfil'
import { PerfilContext, type PerfilContextValue } from './PerfilContext'

/**
 * PROTOTIPO: el perfil, su borrador, la minuta y la firma viven solo en el estado de React.
 * Se pierden al recargar la página o al cerrar sesión. Ver docs/persistencia-perfil.md.
 */
export function PerfilProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // El nombre y el correo de la cuenta se proponen como valores iniciales.
  const [perfil, setPerfil] = useState<PerfilContratista>(() =>
    normalizarPerfil(perfilInicial({ nombre: user?.nombre, email: user?.email })),
  )
  const [borrador, setBorrador] = useState<PerfilContratista>(perfil)
  const [firma, setFirma] = useState<ArchivoValidado | null>(null)
  // Misma validación local que los documentos anexos: PDF, DOC o DOCX de hasta 10 MB.
  const minuta = useValidacionAnexo()

  function aplicarCampos(campos: Partial<PerfilContratista>) {
    const limpio = normalizarPerfil({ ...perfil, ...campos })
    setPerfil(limpio)
    // En el borrador solo se actualizan los campos aplicados (y el nombre completo derivado).
    const aplicados = Object.fromEntries(Object.keys(campos).map((k) => [k, limpio[k as keyof PerfilContratista]]))
    setBorrador((b) => ({ ...b, ...aplicados, nombreCompleto: limpio.nombreCompleto }))
  }

  const value: PerfilContextValue = { perfil, aplicarCampos, borrador, setBorrador, minuta, firma, setFirma }

  return <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
}
