import { CircleCheck, Clock, Download, FileCheck2, FileOutput, Loader2, PencilLine, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useCuentaCobro } from '../../cuenta/CuentaCobroContext'
import { usePerfil } from '../../perfil/PerfilContext'
import { datosReutilizados, pendientesActa, resolverActa, type ContextoActa, type OrigenPendiente } from '../../utils/acta'
import { formatearFechaHora } from '../../utils/informes'
import { ListaFaltantes } from '../anexos/ListaFaltantes'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { buttonClass } from '../ui/styles'
import { DatosActaForm } from './DatosActaForm'
import { DatosReutilizados } from './DatosReutilizados'
import { VistaPreviaActa } from './VistaPreviaActa'

export type EstadoActa = 'pendiente' | 'lista' | 'generada'

/** Apartado de la propia tarjeta con los datos exclusivos del acta. */
const ANCLA_DATOS_ACTA = 'datos-acta'

function EstadoActaBadge({ estado }: { estado: EstadoActa }) {
  if (estado === 'pendiente') return <StatusBadge tone="warning" icon={Clock}>Pendiente de requisitos</StatusBadge>
  if (estado === 'lista') return <StatusBadge tone="info" icon={CircleCheck}>Lista para generar</StatusBadge>
  // «Generada» indica que existe el PDF, no que esté aprobado ni verificado: por eso no usa verde.
  return <StatusBadge tone="info" icon={FileCheck2}>Generada</StatusBadge>
}

/** Momento de generación (se llama desde el manejador del botón, no durante el render). */
const ahora = () => new Date()

const slug = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

interface ActaEjecucionCardProps {
  /** Abre el formulario del soporte correspondiente en Documentos Anexos. */
  onRegistrar: (soporte: 'planilla' | 'estampilla') => void
}

/**
 * Documento GENERADO por Cuenta Ya (no es un soporte de entrada): no se carga, se prepara con los datos
 * de Mi perfil, la planilla, las estampillas y los datos propios del acta.
 */
export function ActaEjecucionCard({ onRegistrar }: ActaEjecucionCardProps) {
  const { perfil, borrador } = usePerfil()
  const { planilla, estampillas, acta, archivos, archivosEstampilla, actaGenerada, setActaGenerada } = useCuentaCobro()
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verPrevia, setVerPrevia] = useState(true)
  const [revisarDatos, setRevisarDatos] = useState(false)
  const perfilSinAplicar = JSON.stringify(borrador) !== JSON.stringify(perfil)

  /** Lleva a los datos de esta acta (en la misma tarjeta) y muestra lo que falta. */
  function irADatosActa() {
    setRevisarDatos(true)
    setVerPrevia(false)
    document.getElementById(ANCLA_DATOS_ACTA)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const ctx: ContextoActa = {
    perfil,
    planilla,
    archivoPlanilla: archivos['seguridad-social'].estado,
    estampillas,
    archivoEstampilla: archivos.estampilla.estado,
    archivosEstampilla,
    acta,
  }
  const pendientes = pendientesActa(ctx)
  // Huella de los datos que aparecen en el PDF: si cambia, el PDF generado deja de corresponder.
  const firmaDatos = pendientes.length === 0 ? JSON.stringify(resolverActa(ctx)) : null
  const vigente = actaGenerada && actaGenerada.firmaDatos === firmaDatos ? actaGenerada : null
  const desactualizada = Boolean(actaGenerada && !vigente)
  const estado: EstadoActa = pendientes.length ? 'pendiente' : vigente ? 'generada' : 'lista'

  async function generar() {
    if (!firmaDatos) return
    setGenerando(true)
    setError(null)
    try {
      // jsPDF solo se descarga cuando se genera un acta.
      const { generarActaPdf } = await import('../../acta/generarActaPdf')
      const resultado = generarActaPdf(resolverActa(ctx))
      setActaGenerada({
        url: URL.createObjectURL(new Blob([resultado.bytes], { type: 'application/pdf' })),
        nombreArchivo: `acta-ejecucion-parcial-${slug(acta.numeroActa)}-contrato-${slug(perfil.numeroContrato)}.pdf`,
        generadaEn: ahora(),
        bloquesMovidos: resultado.bloquesMovidos,
        firmaDatos,
      })
      setVerPrevia(true)
    } catch (e) {
      setError(
        e instanceof Error && e.name === 'ActaDesbordadaError'
          ? e.message
          : 'No se pudo generar el documento. Revisa los datos e inténtalo de nuevo.',
      )
    } finally {
      setGenerando(false)
    }
  }

  /** Enlace para editar los datos reutilizados en su apartado de origen (no se duplican aquí). */
  const editar = (origen: Exclude<OrigenPendiente, 'acta'>) => {
    const clase = 'text-xs font-semibold text-action hover:underline'
    switch (origen) {
      case 'perfil':
        return <Link to="/mi-perfil#datos-basicos" className={clase}>Editar en Mi perfil</Link>
      case 'contrato':
        return <Link to="/mi-perfil#revision-contrato" className={clase}>Revisar en Mi perfil</Link>
      case 'planilla':
      case 'estampilla':
        return <button type="button" onClick={() => onRegistrar(origen)} className={clase}>Editar datos</button>
    }
  }

  /** Enlace directo al apartado donde se completa cada pendiente. */
  const accion = (origen: OrigenPendiente) => {
    switch (origen) {
      case 'perfil':
        return <Link to="/mi-perfil#datos-basicos" className={buttonClass('secondary', 'sm')}>Completar en Mi perfil</Link>
      case 'contrato':
        return <Link to="/mi-perfil#revision-contrato" className={buttonClass('secondary', 'sm')}>Revisar datos contractuales</Link>
      case 'planilla':
        return <Button variant="secondary" size="sm" onClick={() => onRegistrar('planilla')}>Registrar datos de la planilla</Button>
      case 'estampilla':
        return <Button variant="secondary" size="sm" onClick={() => onRegistrar('estampilla')}>Registrar estampillas</Button>
      case 'acta':
        return <Button variant="secondary" size="sm" onClick={irADatosActa}>Ir a los datos de esta acta</Button>
    }
  }

  return (
    <section id="acta-ejecucion" aria-labelledby="titulo-acta-ejecucion" className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-primary/25 bg-card shadow-card">
      <header className="flex flex-wrap items-center gap-3 bg-primary px-5 py-4 text-white">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent">
          <FileOutput className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="titulo-acta-ejecucion" className="font-semibold">Acta de Ejecución Parcial</h3>
          <p className="text-xs text-white/80">Documento que genera Cuenta Ya · No necesitas cargarlo</p>
        </div>
        <EstadoActaBadge estado={estado} />
      </header>

      <div className="space-y-5 p-5">
        <p className="text-sm text-ink">
          Se prepara automáticamente con lo que ya registraste: datos personales y del contrato (Mi perfil), seguridad social
          (planilla) y estampillas. Aquí solo se piden los datos que cambian en cada acta. El PDF es una plantilla de
          referencia: no incluye firmas ni queda aprobado o verificado.
        </p>

        {perfilSinAplicar && (
          <FormAlert variant="info">
            Tienes cambios sin guardar o sin confirmar en Mi perfil. El acta usa los datos básicos guardados y los datos
            contractuales confirmados;{' '}
            <Link to="/mi-perfil" className="font-semibold underline">abre Mi perfil para guardarlos o confirmarlos</Link>.
          </FormAlert>
        )}

        <DatosReutilizados grupos={datosReutilizados(ctx)} accion={editar} />

        {/* Datos exclusivos de esta acta, en la misma tarjeta (sin cambiar de pantalla). */}
        <div id={ANCLA_DATOS_ACTA} className="scroll-mt-24 rounded-xl border border-line p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <PencilLine className="h-4 w-4 text-action" aria-hidden="true" />
            Datos de esta acta
          </h4>
          <DatosActaForm revisar={revisarDatos} />
        </div>

        {pendientes.length > 0 ? (
          <div className="space-y-3" aria-live="polite">
            <h4 className="text-sm font-semibold text-primary">Requisitos que faltan para generar el acta</h4>
            {pendientes.map((p) => (
              <div key={p.id} className="rounded-xl border border-accent/50 bg-accent-soft/60 p-3 text-sm text-ink">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{p.titulo}</span>
                  {accion(p.id)}
                </div>
                <ListaFaltantes mensajes={p.detalles} max={6} />
              </div>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink" aria-live="polite">
            <CircleCheck className="h-4 w-4 text-action" aria-hidden="true" />
            Todos los datos obligatorios y los soportes requeridos están presentes.
          </p>
        )}

        {desactualizada && (
          <FormAlert variant="info">
            Los datos cambiaron después de generar el acta. Vuelve a generarla para obtener un PDF actualizado.
          </FormAlert>
        )}
        {error && <FormAlert variant="error">{error}</FormAlert>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generar()} disabled={pendientes.length > 0 || generando}>
            {generando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : vigente ? (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            ) : (
              <FileOutput className="h-4 w-4" aria-hidden="true" />
            )}
            {vigente ? 'Volver a generar' : 'Generar acta'}
          </Button>
          {vigente && (
            <>
              <a href={vigente.url} download={vigente.nombreArchivo} className={buttonClass('secondary')}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Descargar PDF
              </a>
              <Button variant="ghost" onClick={() => setVerPrevia((v) => !v)}>
                {verPrevia ? 'Ocultar vista previa' : 'Ver vista previa'}
              </Button>
            </>
          )}
        </div>
        {pendientes.length > 0 && (
          <p className="text-xs text-ink-muted">«Generar acta» se habilita cuando no quedan requisitos pendientes.</p>
        )}

        {vigente && (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="text-sm text-ink">
              Generada el {formatearFechaHora(vigente.generadaEn)} en tu navegador. El PDF no se ha subido ni guardado:
              se pierde al recargar la página.
            </p>
            {verPrevia && (
              <VistaPreviaActa
                url={vigente.url}
                nombreArchivo={vigente.nombreArchivo}
                bloquesMovidos={vigente.bloquesMovidos}
                onVolver={irADatosActa}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
