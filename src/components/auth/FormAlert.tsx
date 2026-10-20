import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { ReactNode } from 'react'

const variantes = {
  error: { clase: 'border-danger/20 bg-danger-soft text-danger', Icono: AlertCircle },
  success: { clase: 'border-success/20 bg-success-soft text-success', Icono: CheckCircle2 },
  info: { clase: 'border-accent/50 bg-accent-soft text-warning', Icono: Info },
}

interface FormAlertProps {
  variant: keyof typeof variantes
  children: ReactNode
}

export function FormAlert({ variant, children }: FormAlertProps) {
  const { clase, Icono } = variantes[variant]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${clase}`}
    >
      <Icono className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
