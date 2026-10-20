import type { Indicador } from '../../types'

export function StatCard({ titulo, valor, detalle, icono: Icono }: Indicador) {
  return (
    <article className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-5 shadow-card">
      <div>
        <p className="text-sm font-medium text-ink-muted">{titulo}</p>
        <p className="mt-2 text-2xl font-bold text-primary">{valor}</p>
        <p className="mt-1 text-xs text-ink-muted">{detalle}</p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-action-soft text-action">
        <Icono className="h-6 w-6" aria-hidden="true" />
      </div>
    </article>
  )
}
