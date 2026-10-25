import { Link2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GrupoReutilizado } from '../../utils/acta'

interface DatosReutilizadosProps {
  grupos: GrupoReutilizado[]
  /** Enlace o botón al apartado donde se edita cada grupo. */
  accion: (id: GrupoReutilizado['id']) => ReactNode
}

/**
 * Datos que el acta toma de otros apartados, en solo lectura: así se ve que no hace falta volver a escribirlos.
 * Para cambiarlos se usa el enlace al apartado de origen.
 */
export function DatosReutilizados({ grupos, accion }: DatosReutilizadosProps) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Link2 className="h-4 w-4 text-action" aria-hidden="true" />
        Datos que se toman de lo que ya registraste
      </h4>
      <p className="mt-1 text-xs text-ink-muted">No se vuelven a pedir aquí. Si algo está mal, corrígelo en su apartado.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {grupos.map((g) => (
          <section key={g.id} aria-label={g.titulo} className="rounded-lg border border-line bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h5 className="text-sm font-semibold text-primary">{g.titulo}</h5>
              {accion(g.id)}
            </div>
            {g.nota && <p className="mt-2 text-xs text-ink">{g.nota}</p>}
            {g.filas.length > 0 && (
              <dl className="mt-2 space-y-1 text-xs">
                {g.filas.map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="grid grid-cols-[minmax(0,9rem)_1fr] gap-2">
                    <dt className="text-ink-muted">{etiqueta}</dt>
                    <dd className={`line-clamp-2 break-words ${valor.includes('Sin registrar') ? 'text-ink-muted italic' : 'font-medium text-ink'}`}>
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
