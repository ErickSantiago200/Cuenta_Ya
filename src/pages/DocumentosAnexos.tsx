import { ArrowDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ActaEjecucionCard } from '../components/acta/ActaEjecucionCard'
import { AnexoValidatorCard } from '../components/anexos/AnexoValidatorCard'
import { EstampillaModal } from '../components/anexos/EstampillaModal'
import { PlanillaModal } from '../components/anexos/PlanillaModal'
import { RequisitoBadge } from '../components/anexos/RequisitoBadge'
import { FormAlert } from '../components/auth/FormAlert'
import { buttonClass } from '../components/ui/styles'
import { useCuentaCobro } from '../cuenta/CuentaCobroContext'
import { anexos, type TipoAnexo } from '../data/anexos'
import { etiquetaPeriodo } from '../utils/informes'
import { estadoEstampillas, estadoPlanilla, estadoSoloArchivo, type EstadoRequisito } from '../utils/soportes'

type FormularioAbierto = 'planilla' | 'estampilla' | null

/** Enlaces directos (p. ej. desde el formulario del acta) que abren el formulario correspondiente. */
const HASH_FORMULARIO: Record<string, FormularioAbierto> = {
  '#datos-planilla': 'planilla',
  '#datos-estampillas': 'estampilla',
}

export function DocumentosAnexos() {
  const { archivos, planilla, estampillas, archivosEstampilla } = useCuentaCobro()
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [elegido, setFormulario] = useState<FormularioAbierto>(null)
  // Un enlace directo (#datos-planilla, #datos-estampillas) también abre el formulario.
  const formulario = elegido ?? HASH_FORMULARIO[hash] ?? null

  useEffect(() => {
    if (hash && !HASH_FORMULARIO[hash]) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  function cerrarFormulario() {
    setFormulario(null)
    // Se quita el hash para que el formulario no se vuelva a abrir.
    if (HASH_FORMULARIO[hash]) navigate({ hash: '' }, { replace: true })
  }

  const requisito = (tipo: TipoAnexo): EstadoRequisito => {
    if (tipo === 'seguridad-social') return estadoPlanilla(planilla, archivos[tipo].estado)
    if (tipo === 'estampilla') return estadoEstampillas(estampillas, archivos[tipo].estado, archivosEstampilla)
    return estadoSoloArchivo(archivos[tipo].estado)
  }

  const resumenPlanilla = planilla.numeroPlanilla
    ? `Planilla N.º ${planilla.numeroPlanilla}${planilla.periodoSalud ? ` · ${etiquetaPeriodo(planilla.periodoSalud)}` : ''}`
    : 'Sin datos registrados.'
  const resumenEstampilla =
    estampillas.requerida === 'no'
      ? 'Marcada como no requerida para este contrato.'
      : estampillas.requerida === 'si'
        ? `${estampillas.items.length} ${estampillas.items.length === 1 ? 'estampilla registrada' : 'estampillas registradas'}.`
        : 'Sin datos registrados.'

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Documentos Anexos</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink">
            Prepara los soportes de tu cuenta de cobro (PDF, DOC o DOCX de hasta 10 MB) y genera el Acta de Ejecución Parcial.
          </p>
        </div>
        <a href="#acta-ejecucion" className={`${buttonClass('secondary')} shrink-0`}>
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
          Ir al acta de ejecución
        </a>
      </header>

      <FormAlert variant="info">
        <strong>Validación local, sin almacenamiento.</strong> Los archivos y los datos se revisan en tu navegador; no se
        suben a ningún servidor ni se guardan. Se conservan mientras navegas por Cuenta Ya, pero se pierden al recargar la
        página, cerrar la pestaña o cerrar sesión.
      </FormAlert>

      <section aria-labelledby="titulo-soportes" className="space-y-4">
        <div>
          <h2 id="titulo-soportes" className="text-lg font-semibold text-primary">Soportes de entrada</h2>
          <p className="text-sm text-ink">Documentos que tú aportas. Cuenta Ya valida su formato, pero no su contenido.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink">
          <span className="font-semibold text-primary">Estados:</span>
          <span className="inline-flex items-center gap-1.5"><RequisitoBadge estado="pendiente" /> faltan datos o el soporte</span>
          <span className="inline-flex items-center gap-1.5"><RequisitoBadge estado="completo" /> datos y archivo presentes, sin verificar su contenido</span>
          <span className="inline-flex items-center gap-1.5"><RequisitoBadge estado="no-requerida" /> no aplica al contrato</span>
          <span className="text-ink-muted">«Verificado» requiere una comprobación real que aún no está disponible.</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {anexos.map((anexo) => (
            <AnexoValidatorCard
              key={anexo.tipo}
              anexo={anexo}
              requisito={requisito(anexo.tipo)}
              {...(anexo.tipo === 'seguridad-social'
                ? { onRegistrarDatos: () => setFormulario('planilla'), resumen: resumenPlanilla }
                : anexo.tipo === 'estampilla'
                  ? {
                      onRegistrarDatos: () => setFormulario('estampilla'),
                      resumen: resumenEstampilla,
                      notaArchivo: 'Soporte general: úsalo si un solo archivo cubre todas las estampillas; también puedes adjuntar uno por estampilla en «Registrar datos».',
                    }
                  : {})}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="titulo-generado" className="space-y-4">
        <div>
          <h2 id="titulo-generado" className="text-lg font-semibold text-primary">Documento generado</h2>
          <p className="text-sm text-ink">Cuenta Ya lo prepara a partir de los datos anteriores; no tienes que cargarlo.</p>
        </div>
        <ActaEjecucionCard onRegistrar={setFormulario} />
      </section>

      <PlanillaModal abierto={formulario === 'planilla'} onCerrar={cerrarFormulario} />
      <EstampillaModal abierto={formulario === 'estampilla'} onCerrar={cerrarFormulario} />
    </div>
  )
}
