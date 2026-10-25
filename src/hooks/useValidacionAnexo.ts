import { useRef, useState } from 'react'
import { validarArchivoAnexo } from '../utils/files'

export interface ArchivoValidado {
  /** Referencia en memoria al archivo elegido; se pierde al recargar la página o cerrar sesión. */
  file: File
  nombre: string
  tamano: number
  formato: string
  mime: string
}

export type EstadoValidacion =
  | { fase: 'vacio' }
  | { fase: 'validando'; nombre: string }
  | { fase: 'valido'; archivo: ArchivoValidado }
  | { fase: 'invalido'; nombre: string; error: string }

/** Validación local de un documento anexo. No sube, no guarda y no persiste el archivo. */
export function useValidacionAnexo() {
  const [estado, setEstado] = useState<EstadoValidacion>({ fase: 'vacio' })
  // Evita que una validación lenta anterior sobrescriba el resultado de una selección más reciente.
  const ultimaSeleccion = useRef(0)

  async function seleccionar(file: File) {
    const seleccion = ++ultimaSeleccion.current
    setEstado({ fase: 'validando', nombre: file.name })
    const resultado = await validarArchivoAnexo(file)
    if (seleccion !== ultimaSeleccion.current) return
    setEstado(
      resultado.ok
        ? {
            fase: 'valido',
            archivo: { file, nombre: file.name, tamano: file.size, formato: resultado.formato, mime: resultado.mime },
          }
        : { fase: 'invalido', nombre: file.name, error: resultado.error },
    )
  }

  function quitar() {
    ultimaSeleccion.current++
    setEstado({ fase: 'vacio' })
  }

  return { estado, seleccionar, quitar }
}
