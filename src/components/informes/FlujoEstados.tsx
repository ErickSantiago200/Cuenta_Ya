import { Check, Lock } from 'lucide-react'
import { ESTADOS_INFORME } from '../../data/informes'
import type { EstadoInforme } from '../../types'
import { Button } from '../ui/Button'

/** Vista previa del flujo previsto. No permite cambiar de estado: envío, revisión y aprobación no existen aún. */
export function FlujoEstados({ estado }: { estado: EstadoInforme }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <h2 className="font-semibold text-primary">Flujo del informe (vista previa)</h2>
      <p className="mt-1 text-sm text-ink">
        Estados preliminares, pendientes de validación. El envío, la revisión y la aprobación aún no están
        disponibles en Cuenta Ya: ningún estado se cambia desde aquí.
      </p>

      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Estados del flujo">
        {ESTADOS_INFORME.map((paso) => {
          const actual = paso === estado
          return (
            <li
              key={paso}
              aria-current={actual ? 'step' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                actual ? 'border-primary bg-primary text-white' : 'border-line bg-canvas text-ink-muted'
              }`}
            >
              {actual && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {paso}
            </li>
          )
        })}
      </ol>

      <div className="mt-4">
        <Button variant="secondary" size="sm" disabled title="Disponible en una fase futura">
          <Lock className="h-4 w-4" aria-hidden="true" />
          Enviar informe · Próximamente
        </Button>
      </div>
    </section>
  )
}
