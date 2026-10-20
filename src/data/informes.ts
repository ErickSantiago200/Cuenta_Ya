import type { StatusTone } from '../components/ui/StatusBadge'
import type { EstadoInforme, InformeActividades, ObligacionContractual } from '../types'

export const ESTADOS_INFORME: EstadoInforme[] = [
  'Borrador',
  'Enviado',
  'En revisión',
  'Requiere ajustes',
  'Aprobado',
]

/** Color de cada estado; lo comparten el panel principal y el módulo Informes. */
export const tonoEstadoInforme: Record<EstadoInforme | 'Pendiente', StatusTone> = {
  Borrador: 'neutral',
  Enviado: 'info',
  'En revisión': 'warning',
  'Requiere ajustes': 'danger',
  Aprobado: 'success',
  Pendiente: 'neutral',
}

/**
 * LISTA PROVISIONAL DE EJEMPLO. No son obligaciones contractuales reales:
 * se reemplazará por las obligaciones del contrato cuando exista el módulo Contrato.
 */
export const obligacionesProvisionales: ObligacionContractual[] = [
  { id: 'ejemplo-1', texto: 'Ejemplo 1 · Apoyar las actividades administrativas del área asignada' },
  { id: 'ejemplo-2', texto: 'Ejemplo 2 · Elaborar los documentos o productos solicitados' },
  { id: 'ejemplo-3', texto: 'Ejemplo 3 · Asistir a las reuniones programadas por la dependencia' },
  { id: 'ejemplo-4', texto: 'Ejemplo 4 · Mantener organizada la información a su cargo' },
]

export function textoObligacion(id: string): string | null {
  return obligacionesProvisionales.find((o) => o.id === id)?.texto ?? null
}

/**
 * EJEMPLOS DE DEMOSTRACIÓN. Solo ilustran cómo se verían los estados futuros del flujo;
 * no representan informes, revisiones ni aprobaciones reales. Son de solo lectura.
 */
export const informesDemo: InformeActividades[] = [
  {
    id: 'demo-1',
    numero: null,
    esDemo: true,
    estado: 'Enviado',
    periodo: '2026-04',
    fechaInicio: '2026-04-01',
    fechaFin: '2026-04-30',
    actualizado: new Date(2026, 4, 4, 10, 15),
    observaciones: 'Ejemplo de demostración.',
    actividades: [
      {
        id: 'demo-1-a1',
        descripcion: 'Actividad de demostración: apoyo en la organización de documentos del área.',
        obligacionId: 'ejemplo-4',
        resultado: 'Resultado de demostración: archivo organizado.',
      },
    ],
  },
  {
    id: 'demo-2',
    numero: null,
    esDemo: true,
    estado: 'En revisión',
    periodo: '2026-03',
    fechaInicio: '2026-03-01',
    fechaFin: '2026-03-31',
    actualizado: new Date(2026, 3, 6, 9, 0),
    observaciones: 'Ejemplo de demostración.',
    actividades: [
      {
        id: 'demo-2-a1',
        descripcion: 'Actividad de demostración: elaboración de un documento solicitado.',
        obligacionId: 'ejemplo-2',
        resultado: 'Resultado de demostración: documento entregado.',
      },
    ],
  },
  {
    id: 'demo-3',
    numero: null,
    esDemo: true,
    estado: 'Requiere ajustes',
    periodo: '2026-02',
    fechaInicio: '2026-02-01',
    fechaFin: '2026-02-28',
    actualizado: new Date(2026, 2, 10, 16, 40),
    observaciones: 'Ejemplo de demostración.',
    actividades: [
      {
        id: 'demo-3-a1',
        descripcion: 'Actividad de demostración: asistencia a reuniones de seguimiento.',
        obligacionId: 'ejemplo-3',
        resultado: 'Resultado de demostración: actas de reunión.',
      },
    ],
  },
  {
    id: 'demo-4',
    numero: null,
    esDemo: true,
    estado: 'Aprobado',
    periodo: '2026-01',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-01-31',
    actualizado: new Date(2026, 1, 5, 11, 20),
    observaciones: 'Ejemplo de demostración.',
    actividades: [
      {
        id: 'demo-4-a1',
        descripcion: 'Actividad de demostración: apoyo administrativo general.',
        obligacionId: '',
        resultado: 'Resultado de demostración: tareas completadas.',
      },
    ],
  },
]
