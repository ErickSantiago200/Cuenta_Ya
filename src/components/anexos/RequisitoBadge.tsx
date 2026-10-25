import { CircleCheck, CircleMinus, Clock, ShieldCheck } from 'lucide-react'
import type { EstadoRequisito } from '../../utils/soportes'
import { StatusBadge } from '../ui/StatusBadge'

/**
 * Estado del requisito. «Completo» usa el tono informativo (no verde): seleccionar un archivo con formato
 * válido no equivale a revisar su contenido. El verde queda reservado para «Verificado».
 */
export function RequisitoBadge({ estado }: { estado: EstadoRequisito }) {
  switch (estado) {
    case 'pendiente':
      return <StatusBadge tone="warning" icon={Clock}>Pendiente</StatusBadge>
    case 'completo':
      return <StatusBadge tone="info" icon={CircleCheck}>Completo</StatusBadge>
    case 'no-requerida':
      return <StatusBadge tone="neutral" icon={CircleMinus}>No requerida</StatusBadge>
    case 'verificado':
      return <StatusBadge tone="success" icon={ShieldCheck}>Verificado</StatusBadge>
  }
}
