import { ArrowLeft, CalendarDays, ListChecks, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ActividadInforme, DatosInforme } from '../../types'
import {
  etiquetaPeriodo,
  MAX_OBSERVACIONES,
  nuevaActividad,
  PERIODO_VALIDO,
  rangoDelMes,
  validarInforme,
} from '../../utils/informes'
import { FormAlert } from '../auth/FormAlert'
import { TextField } from '../auth/TextField'
import { Button } from '../ui/Button'
import { TextAreaField } from '../ui/TextAreaField'
import { ActividadEditor } from './ActividadEditor'
import { PrototypeNotice } from './PrototypeNotice'

interface InformeFormProps {
  modo: 'crear' | 'editar'
  titulo: string
  inicial: DatosInforme
  /** A dónde volver al cancelar (listado al crear, consulta al editar). */
  destinoCancelar: string
  /** Recibe datos ya validados. */
  onGuardar: (datos: DatosInforme) => void
}

type Aviso = { tipo: 'success' | 'error'; texto: string } | null

/** Formulario compartido para crear y editar borradores (en memoria). */
export function InformeForm({ modo, titulo, inicial, destinoCancelar, onGuardar }: InformeFormProps) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState<DatosInforme>(inicial)
  const [mostrarErrores, setMostrarErrores] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)

  const errores = validarInforme(datos)
  const totalErrores = Object.keys(errores).length
  const visibles = mostrarErrores ? errores : {}
  const hayCambios = JSON.stringify(datos) !== JSON.stringify(inicial)
  const accion = modo === 'crear' ? 'Crear borrador' : 'Actualizar borrador'

  function actualizar(cambio: (d: DatosInforme) => DatosInforme) {
    setDatos(cambio)
    setAviso(null)
  }

  function cambiarPeriodo(periodo: string) {
    // Al elegir un mes válido se proponen el primer y el último día; el usuario puede ajustarlos.
    actualizar((d) => {
      if (!PERIODO_VALIDO.test(periodo)) return { ...d, periodo }
      const { inicio, fin } = rangoDelMes(periodo)
      return { ...d, periodo, fechaInicio: inicio, fechaFin: fin }
    })
  }

  function cambiarActividad(id: string, cambios: Partial<ActividadInforme>) {
    actualizar((d) => ({
      ...d,
      actividades: d.actividades.map((a) => (a.id === id ? { ...a, ...cambios } : a)),
    }))
  }

  function mensajeErrores() {
    return `Hay ${totalErrores} ${totalErrores === 1 ? 'campo' : 'campos'} por corregir. Revisa los mensajes en rojo.`
  }

  function validar() {
    setMostrarErrores(true)
    setAviso(
      totalErrores
        ? { tipo: 'error', texto: mensajeErrores() }
        : {
            tipo: 'success',
            texto: `Todos los campos obligatorios están completos. Usa «${accion}» para conservar los cambios durante esta sesión.`,
          },
    )
  }

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMostrarErrores(true)
    if (totalErrores) {
      setAviso({ tipo: 'error', texto: mensajeErrores() })
      return
    }
    onGuardar(datos)
  }

  function cancelar() {
    if (hayCambios && !window.confirm('¿Descartar los cambios que no has guardado en el borrador?')) return
    navigate(destinoCancelar)
  }

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
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{titulo}</h1>
        <PrototypeNotice />
        <p className="text-sm text-ink">
          Los campos marcados con <span className="text-danger">*</span> son obligatorios.
        </p>
      </div>

      <form onSubmit={guardar} noValidate className="space-y-6">
        {/* Periodo */}
        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-primary">
            <CalendarDays className="h-5 w-5 text-action" aria-hidden="true" />
            Periodo
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Periodo del informe"
              type="month"
              required
              placeholder="AAAA-MM"
              value={datos.periodo}
              onChange={(e) => cambiarPeriodo(e.target.value)}
              error={visibles.periodo}
              hint={PERIODO_VALIDO.test(datos.periodo) ? etiquetaPeriodo(datos.periodo) : 'Al elegir el mes se proponen las fechas.'}
            />
            <TextField
              label="Fecha de inicio"
              type="date"
              required
              value={datos.fechaInicio}
              onChange={(e) => actualizar((d) => ({ ...d, fechaInicio: e.target.value }))}
              error={visibles.fechaInicio}
            />
            <TextField
              label="Fecha de finalización"
              type="date"
              required
              min={datos.fechaInicio || undefined}
              value={datos.fechaFin}
              onChange={(e) => actualizar((d) => ({ ...d, fechaFin: e.target.value }))}
              error={visibles.fechaFin}
            />
          </div>
        </section>

        {/* Actividades */}
        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-primary">
              <ListChecks className="h-5 w-5 text-action" aria-hidden="true" />
              Actividades realizadas
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => actualizar((d) => ({ ...d, actividades: [...d.actividades, nuevaActividad()] }))}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar actividad
            </Button>
          </div>

          {visibles.actividades && (
            <div className="mb-4">
              <FormAlert variant="error">{visibles.actividades}</FormAlert>
            </div>
          )}

          <div className="space-y-4">
            {datos.actividades.map((actividad, indice) => (
              <ActividadEditor
                key={actividad.id}
                indice={indice}
                actividad={actividad}
                errores={visibles}
                onChange={(cambios) => cambiarActividad(actividad.id, cambios)}
                onQuitar={() =>
                  actualizar((d) => ({ ...d, actividades: d.actividades.filter((a) => a.id !== actividad.id) }))
                }
              />
            ))}
            {datos.actividades.length === 0 && (
              <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-ink">
                No hay actividades. Usa «Agregar actividad» para registrar la primera.
              </p>
            )}
          </div>
        </section>

        {/* Observaciones */}
        <section className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <TextAreaField
            label="Observaciones generales"
            rows={4}
            maxLength={MAX_OBSERVACIONES}
            placeholder="Información adicional sobre el periodo (opcional)"
            value={datos.observaciones}
            onChange={(e) => actualizar((d) => ({ ...d, observaciones: e.target.value }))}
            error={visibles.observaciones}
            hint="Opcional."
          />
        </section>

        {/* Acciones */}
        <div className="space-y-3">
          <div aria-live="polite">{aviso && <FormAlert variant={aviso.tipo}>{aviso.texto}</FormAlert>}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={cancelar}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={validar}>
              Validar campos
            </Button>
            <Button type="submit">{accion}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
