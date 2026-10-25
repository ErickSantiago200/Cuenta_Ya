import { Briefcase, Pencil } from 'lucide-react'
import { Link } from 'react-router'
import type { PerfilContratista } from '../../types'
import { formatearFecha } from '../../utils/informes'
import { calcularDuracion, describirDuracion, formatearCOP } from '../../utils/perfil'
import { buttonClass } from '../ui/styles'

function Dato({ etiqueta, valor, ancho = false }: { etiqueta: string; valor: string; ancho?: boolean }) {
  return (
    <div className={ancho ? 'sm:col-span-2 lg:col-span-4' : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{etiqueta}</dt>
      <dd className={`mt-0.5 text-sm ${valor ? 'text-ink' : 'italic text-ink-muted'}`}>{valor || 'Pendiente'}</dd>
    </div>
  )
}

/** Información contractual registrada en Mi perfil; los datos faltantes se muestran como pendientes. */
export function ContractSummary({ perfil }: { perfil: PerfilContratista }) {
  const duracion = calcularDuracion(perfil.fechaInicio, perfil.fechaTerminacion)
  const hayDatos = [
    perfil.numeroContrato,
    perfil.entidadContratante,
    perfil.valorContrato,
    perfil.fechaInicio,
    perfil.fechaTerminacion,
    perfil.objetoContractual,
  ].some(Boolean)

  return (
    <section className="rounded-2xl border border-line bg-card shadow-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <Briefcase className="h-5 w-5 text-action" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-primary">Información contractual</h2>
        <Link to="/mi-perfil#revision-contrato" className={`${buttonClass('secondary', 'sm')} ml-auto`}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          {hayDatos ? 'Editar en Mi perfil' : 'Completar en Mi perfil'}
        </Link>
      </header>

      <div className="px-5 py-4">
        {!hayDatos && (
          <p className="mb-4 text-sm text-ink">
            Aún no has registrado la información de tu contrato. Complétala en Mi perfil para verla aquí.
          </p>
        )}
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Número de contrato" valor={perfil.numeroContrato} />
          <Dato etiqueta="Vigencia" valor={perfil.vigencia} />
          <Dato etiqueta="Entidad contratante" valor={perfil.entidadContratante} />
          <Dato etiqueta="Dependencia" valor={perfil.dependenciaContrato} />
          <Dato etiqueta="Fecha de inicio" valor={perfil.fechaInicio ? formatearFecha(perfil.fechaInicio) : ''} />
          <Dato
            etiqueta="Fecha de terminación"
            valor={perfil.fechaTerminacion ? formatearFecha(perfil.fechaTerminacion) : ''}
          />
          <Dato etiqueta="Duración" valor={duracion ? describirDuracion(duracion) : ''} />
          <Dato etiqueta="Valor del contrato" valor={perfil.valorContrato ? formatearCOP(perfil.valorContrato) : ''} />
          <Dato etiqueta="Objeto contractual" valor={perfil.objetoContractual} ancho />
        </dl>
        <p className="mt-4 text-xs text-ink-muted">
          Datos temporales de esta sesión: se perderán al recargar la página.
        </p>
      </div>
    </section>
  )
}
