import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const tonos: Record<StatusTone, string> = {
  neutral: 'bg-canvas text-ink border-line',
  info: 'bg-primary-soft text-primary border-primary/15',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-accent/50',
  danger: 'bg-danger-soft text-danger border-danger/20',
}

interface StatusBadgeProps {
  tone: StatusTone
  icon?: LucideIcon
  children: ReactNode
}

export function StatusBadge({ tone, icon: Icono, children }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tonos[tone]}`}
    >
      {Icono && <Icono className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}
