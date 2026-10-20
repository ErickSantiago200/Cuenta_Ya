import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { informesDemo } from '../data/informes'
import type { DatosInforme, InformeActividades } from '../types'
import { normalizarDatos } from '../utils/informes'
import { InformesContext, type InformesContextValue } from './InformesContext'

/**
 * PROTOTIPO: los informes viven solo en el estado de React.
 * Se pierden al recargar la página o al cerrar sesión (el proveedor se desmonta).
 * No usa localStorage ni ninguna base de datos.
 */
export function InformesProvider({ children }: { children: ReactNode }) {
  const [informes, setInformes] = useState<InformeActividades[]>([])
  const [mostrarDemos, setMostrarDemos] = useState(false)

  const obtener = useCallback(
    (id: string) => informes.find((i) => i.id === id) ?? informesDemo.find((i) => i.id === id),
    [informes],
  )

  const crearBorrador = useCallback(
    (datos: DatosInforme) => {
      const nuevo: InformeActividades = {
        ...normalizarDatos(datos),
        id: crypto.randomUUID(),
        numero: informes.reduce((max, i) => Math.max(max, i.numero ?? 0), 0) + 1,
        estado: 'Borrador',
        actualizado: new Date(),
        esDemo: false,
      }
      setInformes((prev) => [...prev, nuevo])
      return nuevo
    },
    [informes],
  )

  const actualizarBorrador = useCallback(
    (id: string, datos: DatosInforme) => {
      const actual = informes.find((i) => i.id === id)
      if (!actual || actual.esDemo || actual.estado !== 'Borrador') return false
      setInformes((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...normalizarDatos(datos), actualizado: new Date() } : i)),
      )
      return true
    },
    [informes],
  )

  const value = useMemo<InformesContextValue>(
    () => ({
      informes,
      demos: informesDemo,
      mostrarDemos,
      setMostrarDemos,
      obtener,
      crearBorrador,
      actualizarBorrador,
    }),
    [informes, mostrarDemos, obtener, crearBorrador, actualizarBorrador],
  )

  return <InformesContext.Provider value={value}>{children}</InformesContext.Provider>
}
