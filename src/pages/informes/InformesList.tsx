import { Eye, FileText, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { DemoBadge, EstadoInformeBadge } from '../../components/informes/InformeBadges'
import { PrototypeNotice } from '../../components/informes/PrototypeNotice'
import { buttonClass } from '../../components/ui/styles'
import { ESTADOS_INFORME } from '../../data/informes'
import { useInformes } from '../../informes/InformesContext'
import type { EstadoInforme, InformeActividades } from '../../types'
import { etiquetaPeriodo, formatearFecha, formatearFechaHora } from '../../utils/informes'

type Filtro = EstadoInforme | 'Todos'

const esEditable = (i: InformeActividades) => !i.esDemo && i.estado === 'Borrador'

/** Más reciente primero, por periodo y luego por número. */
function ordenarPorPeriodo(a: InformeActividades, b: InformeActividades) {
  return b.periodo.localeCompare(a.periodo) || (b.numero ?? 0) - (a.numero ?? 0)
}

export function InformesList() {
  const { informes, demos, mostrarDemos, setMostrarDemos } = useInformes()
  const [filtro, setFiltro] = useState<Filtro>('Todos')

  const visibles = useMemo(
    () => [...informes, ...(mostrarDemos ? demos : [])].sort(ordenarPorPeriodo),
    [informes, demos, mostrarDemos],
  )
  const filtrados = filtro === 'Todos' ? visibles : visibles.filter((i) => i.estado === filtro)
  const contar = (f: Filtro) => (f === 'Todos' ? visibles.length : visibles.filter((i) => i.estado === f).length)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Informes de actividades</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink">
            Registra, por periodo del contrato, las actividades realizadas, la obligación contractual con la que
            se relacionan y el resultado obtenido.
          </p>
        </div>
        <Link to="/informes/nuevo" className={`${buttonClass('primary')} shrink-0`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Crear informe
        </Link>
      </header>

      <PrototypeNotice />

      <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
        {/* Filtros */}
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
            {(['Todos', ...ESTADOS_INFORME] as Filtro[]).map((f) => {
              const activo = filtro === f
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    activo
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-card text-ink hover:bg-canvas'
                  }`}
                >
                  {f} <span className={activo ? 'text-white/80' : 'text-ink-muted'}>({contar(f)})</span>
                </button>
              )
            })}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={mostrarDemos}
              onChange={(e) => setMostrarDemos(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-action"
            />
            Mostrar ejemplos de demostración
          </label>
        </div>

        {filtrados.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
            {visibles.length === 0 ? (
              <>
                <p className="mt-3 font-semibold text-primary">Aún no has creado informes en esta sesión</p>
                <p className="mt-1 text-sm text-ink">
                  Crea un borrador o activa los ejemplos de demostración para ver cómo se organizan.
                </p>
                <Link to="/informes/nuevo" className={`${buttonClass('primary')} mt-5`}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Crear informe
                </Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink">No hay informes con el estado «{filtro}».</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">N.º</th>
                  <th className="px-5 py-3 font-semibold">Periodo</th>
                  <th className="px-5 py-3 font-semibold">Última modificación</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtrados.map((informe) => (
                  <tr key={informe.id} className={informe.esDemo ? 'bg-canvas/50' : 'hover:bg-canvas/60'}>
                    <td className="px-5 py-3 font-medium text-primary">
                      {informe.esDemo ? <DemoBadge /> : informe.numero}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{etiquetaPeriodo(informe.periodo)}</p>
                      <p className="text-xs text-ink-muted">
                        {formatearFecha(informe.fechaInicio)} – {formatearFecha(informe.fechaFin)}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{formatearFechaHora(informe.actualizado)}</td>
                    <td className="px-5 py-3">
                      <EstadoInformeBadge estado={informe.estado} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/informes/${informe.id}`}
                          className={buttonClass('ghost', 'sm')}
                          aria-label={`Consultar informe de ${etiquetaPeriodo(informe.periodo)}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Consultar
                        </Link>
                        {esEditable(informe) && (
                          <Link
                            to={`/informes/${informe.id}/editar`}
                            className={buttonClass('secondary', 'sm')}
                            aria-label={`Editar borrador de ${etiquetaPeriodo(informe.periodo)}`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
