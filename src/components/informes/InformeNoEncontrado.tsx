import { ArrowLeft, SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { buttonClass } from '../ui/styles'

export function InformeNoEncontrado() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-8 text-center shadow-card">
      <SearchX className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
      <h1 className="mt-3 text-lg font-semibold text-primary">No encontramos este informe</h1>
      <p className="mt-1 text-sm text-ink">
        Los borradores solo existen durante la sesión: si recargaste la página, se perdieron.
      </p>
      <Link to="/informes" className={`${buttonClass('secondary')} mt-5`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al listado
      </Link>
    </div>
  )
}
