/** Clases compartidas para que botones, enlaces con aspecto de botón y campos sean idénticos en toda la app. */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const variantes: Record<ButtonVariant, string> = {
  primary: 'bg-action text-white shadow-card hover:bg-action-hover',
  secondary: 'border border-line bg-card text-primary hover:bg-canvas',
  danger: 'border border-danger/30 bg-card text-danger hover:bg-danger-soft',
  ghost: 'text-ink-muted hover:bg-canvas hover:text-ink',
}

const tamanos: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variant]} ${tamanos[size]}`
}

/** Borde, fondo y anillo de foco de inputs, selects y textareas (el padding horizontal lo pone cada campo). */
export function fieldInputClass(error?: string): string {
  return `w-full rounded-xl border bg-card py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted/70 focus:ring-2 disabled:cursor-not-allowed disabled:bg-canvas ${
    error
      ? 'border-danger focus:border-danger focus:ring-danger-soft'
      : 'border-line focus:border-action focus:ring-action-soft'
  }`
}

/** id del mensaje (error o ayuda) asociado a un campo, para aria-describedby. */
export function fieldMessageId(id: string, error?: string, hint?: string): string | undefined {
  return error || hint ? `${id}-msg` : undefined
}
