import { FlaskConical } from 'lucide-react'

/** Aviso visible y discreto: el módulo Informes es un prototipo sin persistencia. */
export function PrototypeNotice() {
  return (
    <p
      role="note"
      className="flex items-start gap-2 rounded-xl border border-accent/50 bg-accent-soft px-3 py-2 text-sm text-warning"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      Prototipo local: los cambios no se guardan de forma permanente y se perderán al recargar la página.
    </p>
  )
}
