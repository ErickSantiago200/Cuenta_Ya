import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useValidacionAnexo } from '../hooks/useValidacionAnexo'
import type { DatosActa, DatosEstampillas, DatosPlanilla } from '../types'
import { actaVacia } from '../utils/acta'
import { validarArchivoAnexo } from '../utils/files'
import { estampillasVacias, planillaVacia, type ArchivosEstampilla } from '../utils/soportes'
import { CuentaCobroContext, type ActaGenerada, type CuentaCobroContextValue } from './CuentaCobroContext'

/**
 * PROTOTIPO: archivos y datos viven solo en el estado de React mientras dure la sesión.
 * Se pierden al recargar la página o al cerrar sesión. No se suben ni se guardan en el navegador.
 */
export function CuentaCobroProvider({ children }: { children: ReactNode }) {
  // Una validación por categoría, siempre en el mismo orden (regla de los hooks).
  const seguridadSocial = useValidacionAnexo()
  const estampilla = useValidacionAnexo()
  const obligacionContraida = useValidacionAnexo()
  const retencionFuente = useValidacionAnexo()
  const actaInformeParcial = useValidacionAnexo()

  const [planilla, setPlanilla] = useState<DatosPlanilla>(planillaVacia)
  const [estampillas, setEstampillas] = useState<DatosEstampillas>(estampillasVacias)
  const [acta, setActa] = useState<DatosActa>(actaVacia)

  // Soportes por estampilla. El contador por id descarta validaciones lentas ya reemplazadas.
  const [archivosEstampilla, setArchivosEstampilla] = useState<ArchivosEstampilla>({})
  const selecciones = useRef<Record<string, number>>({})

  // Funciones estables (solo usan refs y actualizaciones funcionales del estado).
  const seleccionarArchivoEstampilla = useCallback(async (id: string, file: File) => {
    const seleccion = (selecciones.current[id] ?? 0) + 1
    selecciones.current[id] = seleccion
    setArchivosEstampilla((m) => ({ ...m, [id]: { fase: 'validando', nombre: file.name } }))
    const r = await validarArchivoAnexo(file)
    if (selecciones.current[id] !== seleccion) return
    setArchivosEstampilla((m) => ({
      ...m,
      [id]: r.ok
        ? { fase: 'valido', archivo: { file, nombre: file.name, tamano: file.size, formato: r.formato, mime: r.mime } }
        : { fase: 'invalido', nombre: file.name, error: r.error },
    }))
  }, [])

  const quitarArchivosEstampilla = useCallback((ids: string[]) => {
    for (const id of ids) selecciones.current[id] = (selecciones.current[id] ?? 0) + 1
    setArchivosEstampilla((m) => {
      const resto = { ...m }
      for (const id of ids) delete resto[id]
      return resto
    })
  }, [])

  // Acta generada: se libera la URL local anterior al reemplazarla y al cerrar la sesión.
  const [actaGenerada, setActaGeneradaEstado] = useState<ActaGenerada | null>(null)
  const urlActa = useRef<string | null>(null)
  function setActaGenerada(nueva: ActaGenerada | null) {
    if (urlActa.current && urlActa.current !== nueva?.url) URL.revokeObjectURL(urlActa.current)
    urlActa.current = nueva?.url ?? null
    setActaGeneradaEstado(nueva)
  }
  useEffect(
    () => () => {
      if (urlActa.current) URL.revokeObjectURL(urlActa.current)
    },
    [],
  )

  const value: CuentaCobroContextValue = {
    archivos: {
      'seguridad-social': seguridadSocial,
      estampilla,
      'obligacion-contraida': obligacionContraida,
      'retencion-fuente': retencionFuente,
      'acta-informe-parcial': actaInformeParcial,
    },
    planilla,
    setPlanilla,
    estampillas,
    setEstampillas,
    archivosEstampilla,
    seleccionarArchivoEstampilla,
    quitarArchivosEstampilla,
    acta,
    setActa,
    actaGenerada,
    setActaGenerada,
  }

  return <CuentaCobroContext.Provider value={value}>{children}</CuentaCobroContext.Provider>
}
