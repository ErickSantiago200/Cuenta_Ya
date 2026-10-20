import { ClipboardList, FlaskConical } from 'lucide-react'
import { tonoEstadoInforme } from '../../data/informes'
import type { ResumenInforme } from '../../types'
import { StatusBadge } from '../ui/StatusBadge'

interface ReportsTableProps {
  informes: ResumenInforme[]
}

export function ReportsTable({ informes }: ReportsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <ClipboardList className="h-5 w-5 text-action" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-primary">Resumen de Informes</h2>
        <span className="ml-auto">
          <StatusBadge tone="neutral" icon={FlaskConical}>
            Datos de demostración
          </StatusBadge>
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">N.º</th>
              <th className="px-5 py-3 font-semibold">Periodo</th>
              <th className="px-5 py-3 font-semibold">Fecha de envío</th>
              <th className="px-5 py-3 font-semibold">Valor</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {informes.map((informe) => (
              <tr key={informe.id} className="hover:bg-canvas/60">
                <td className="px-5 py-3 font-medium text-primary">{informe.numero}</td>
                <td className="px-5 py-3 text-ink">{informe.periodo}</td>
                <td className="px-5 py-3 text-ink-muted">{informe.fechaEnvio ?? '—'}</td>
                <td className="px-5 py-3 text-ink">{informe.valor}</td>
                <td className="px-5 py-3">
                  <StatusBadge tone={tonoEstadoInforme[informe.estado]}>{informe.estado}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
