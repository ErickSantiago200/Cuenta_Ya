import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { FormAlert } from '../../components/auth/FormAlert'
import { FlujoEstados } from '../../components/informes/FlujoEstados'
import { DemoBadge, EstadoInformeBadge } from '../../components/informes/InformeBadges'
import { InformeNoEncontrado } from '../../components/informes/InformeNoEncontrado'
import { PrototypeNotice } from '../../components/informes/PrototypeNotice'
import { buttonClass } from '../../components/ui/styles'
import { textoObligacion } from '../../data/informes'
import { useInformes } from '../../informes/InformesContext'
import { etiquetaPeriodo, formatearFecha, formatearFechaHora } from '../../utils/informes'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-ink">{valor}</dd>
    </div>
  )
}

export function InformeDetalle() {
  const { id = '' } = useParams()
  const location = useLocation()
  const { obtener } = useInformes()
  const informe = obtener(id)
  const mensaje = (location.state as { mensaje?: string } | null)?.mensaje

  if (!informe) return <InformeNoEncontrado />

  const editable = !informe.esDemo && informe.estado === 'Borrador'
  const periodo = etiquetaPeriodo(informe.periodo)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Link
          to="/informes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-action hover:text-action-hover hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al listado
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              {informe.esDemo ? `Ejemplo · ${periodo}` : `Informe N.º ${informe.numero} · ${periodo}`}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <EstadoInformeBadge estado={informe.estado} />
              {informe.esDemo && <DemoBadge />}
            </div>
          </div>
          {editable && (
            <Link to={`/informes/${informe.id}/editar`} className={`${buttonClass('primary')} shrink-0`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar borrador
            </Link>
          )}
        </div>

        {informe.esDemo ? (
          <FormAlert variant="info">
            <strong>Ejemplo de demostración.</strong> No corresponde a un informe real, ni a un envío, revisión o
            aprobación institucional. Es de solo lectura.
          </FormAlert>
        ) : (
          <PrototypeNotice />
        )}
        {mensaje && <FormAlert variant="success">{mensaje}</FormAlert>}
      </div>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-4 font-semibold text-primary">Datos del periodo</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Periodo" valor={periodo} />
          <Dato etiqueta="Fecha de inicio" valor={formatearFecha(informe.fechaInicio)} />
          <Dato etiqueta="Fecha de finalización" valor={formatearFecha(informe.fechaFin)} />
          <Dato etiqueta="Última modificación" valor={formatearFechaHora(informe.actualizado)} />
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-4 font-semibold text-primary">
          Actividades realizadas <span className="font-normal text-ink-muted">({informe.actividades.length})</span>
        </h2>
        <ol className="space-y-4">
          {informe.actividades.map((actividad, indice) => {
            const obligacion = textoObligacion(actividad.obligacionId)
            return (
              <li key={actividad.id} className="rounded-xl border border-line p-4">
                <h3 className="text-sm font-semibold text-primary">Actividad {indice + 1}</h3>
                <dl className="mt-3 space-y-3">
                  <Dato etiqueta="Actividad realizada" valor={actividad.descripcion} />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      Obligación contractual relacionada
                    </dt>
                    <dd className="mt-0.5 text-sm text-ink">
                      {obligacion ? (
                        <>
                          {obligacion}{' '}
                          <span className="text-xs text-ink-muted">(lista provisional de ejemplo)</span>
                        </>
                      ) : (
                        <span className="text-ink-muted">Sin seleccionar (pendiente del módulo Contrato)</span>
                      )}
                    </dd>
                  </div>
                  <Dato etiqueta="Resultado o producto obtenido" valor={actividad.resultado} />
                </dl>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <h2 className="mb-2 font-semibold text-primary">Observaciones generales</h2>
        <p className="whitespace-pre-line text-sm text-ink">
          {informe.observaciones || <span className="text-ink-muted">Sin observaciones.</span>}
        </p>
      </section>

      <FlujoEstados estado={informe.estado} />
    </div>
  )
}
