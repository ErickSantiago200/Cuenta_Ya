import { Plus, Trash2 } from 'lucide-react'
import { useCuentaCobro } from '../../cuenta/CuentaCobroContext'
import type { DatosEstampillas, Estampilla } from '../../types'
import { formatearCOP, soloDigitos } from '../../utils/perfil'
import { hoyISO, MAX_ESTAMPILLAS, nuevaEstampilla, validarEstampillas } from '../../utils/soportes'
import { FormAlert } from '../auth/FormAlert'
import { TextField } from '../auth/TextField'
import { Button } from '../ui/Button'
import { ArchivoInline } from './ArchivoInline'

interface EstampillasFormProps {
  datos: DatosEstampillas
  onChange: (datos: DatosEstampillas) => void
  revisar: boolean
}

/** Estampillas del contrato: varias por acta, cada una con su soporte, o «No requerida». */
export function EstampillasForm({ datos, onChange, revisar }: EstampillasFormProps) {
  const { archivos, archivosEstampilla, seleccionarArchivoEstampilla, quitarArchivosEstampilla } = useCuentaCobro()
  const hoy = hoyISO()
  const errores = validarEstampillas(datos, hoy)
  const hayGeneral = archivos.estampilla.estado.fase === 'valido'

  function elegir(requerida: DatosEstampillas['requerida']) {
    // Al indicar que sí se requieren, se propone una fila vacía para empezar.
    onChange({ requerida, items: requerida === 'si' && datos.items.length === 0 ? [nuevaEstampilla()] : datos.items })
  }

  function cambiar(id: string, campo: keyof Estampilla, valor: string) {
    const limpio = campo === 'valor' ? soloDigitos(valor) : valor
    onChange({ ...datos, items: datos.items.map((s) => (s.id === id ? { ...s, [campo]: limpio } : s)) })
  }

  const ver = (clave: string, valor: string) => (revisar || valor !== '' ? errores[clave] : undefined)

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">
          ¿El contrato requiere estampillas para esta cuenta de cobro?<span className="ml-0.5 text-danger" aria-hidden="true">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {([['si', 'Sí, registrar estampillas'], ['no', 'No requerida']] as const).map(([valor, etiqueta]) => (
            <label
              key={valor}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                datos.requerida === valor ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink hover:bg-canvas'
              }`}
            >
              <input type="radio" name="estampilla-requerida" checked={datos.requerida === valor} onChange={() => elegir(valor)} className="accent-action" />
              {etiqueta}
            </label>
          ))}
        </div>
        {revisar && errores.requerida && <p className="mt-1.5 text-xs font-medium text-danger">{errores.requerida}</p>}
      </fieldset>

      {datos.requerida === 'no' && (
        <p className="text-sm text-ink">
          La estampilla quedará como «No requerida» y no bloqueará la generación del acta. Puedes cambiarlo en cualquier momento.
        </p>
      )}

      {datos.requerida === 'si' && (
        <>
          <p className="text-xs text-ink-muted">
            Cada estampilla necesita un soporte: adjúntalo en la estampilla o usa un soporte general en la tarjeta «Estampilla»
            (por ejemplo, un solo PDF con todas).{hayGeneral && ' Ya hay un soporte general válido en la tarjeta.'}
          </p>
          {errores.general && (revisar || datos.items.length > 0) && <FormAlert variant="error">{errores.general}</FormAlert>}
          {datos.items.map((s, i) => (
            <div key={s.id} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary">Estampilla {i + 1}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange({ ...datos, items: datos.items.filter((x) => x.id !== s.id) })}
                  aria-label={`Quitar estampilla ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Quitar
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Tipo de estampilla" required value={s.tipo} onChange={(e) => cambiar(s.id, 'tipo', e.target.value)} error={ver(`${s.id}.tipo`, s.tipo)} />
                <TextField label="Número de estampilla" required value={s.numero} onChange={(e) => cambiar(s.id, 'numero', e.target.value)} error={ver(`${s.id}.numero`, s.numero)} />
                <TextField label="Fecha de pago" type="date" required max={hoy} value={s.fechaPago} onChange={(e) => cambiar(s.id, 'fechaPago', e.target.value)} error={ver(`${s.id}.fechaPago`, s.fechaPago)} />
                <TextField
                  label="Valor"
                  required
                  inputMode="numeric"
                  placeholder="Solo números"
                  value={s.valor}
                  onChange={(e) => cambiar(s.id, 'valor', e.target.value)}
                  error={ver(`${s.id}.valor`, s.valor)}
                  hint={s.valor && !errores[`${s.id}.valor`] ? formatearCOP(s.valor) : undefined}
                />
              </div>
              <div className="mt-3">
                <ArchivoInline
                  etiqueta="Soporte de esta estampilla"
                  estado={archivosEstampilla[s.id]}
                  onSeleccionar={(file) => void seleccionarArchivoEstampilla(s.id, file)}
                  onQuitar={() => quitarArchivosEstampilla([s.id])}
                />
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange({ ...datos, items: [...datos.items, nuevaEstampilla()] })}
            disabled={datos.items.length >= MAX_ESTAMPILLAS}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar estampilla
          </Button>
          {datos.items.length >= MAX_ESTAMPILLAS && <p className="text-xs text-ink-muted">Máximo {MAX_ESTAMPILLAS} estampillas por acta.</p>}
        </>
      )}
    </div>
  )
}
