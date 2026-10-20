import { FlaskConical } from 'lucide-react'
import { tonoEstadoInforme } from '../../data/informes'
import type { EstadoInforme } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'

export function EstadoInformeBadge({ estado }: { estado: EstadoInforme }) {
  return <StatusBadge tone={tonoEstadoInforme[estado]}>{estado}</StatusBadge>
}

export function DemoBadge() {
  return (
    <StatusBadge tone="neutral" icon={FlaskConical}>
      Demostración
    </StatusBadge>
  )
}
