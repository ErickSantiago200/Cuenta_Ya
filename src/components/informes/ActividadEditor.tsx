import { Trash2 } from 'lucide-react'
import { obligacionesProvisionales } from '../../data/informes'
import type { ActividadInforme } from '../../types'
import type { ErroresInforme } from '../../utils/informes'
import { MAX_DESCRIPCION, MAX_RESULTADO } from '../../utils/informes'
import { Button } from '../ui/Button'
import { SelectField } from '../ui/SelectField'
import { TextAreaField } from '../ui/TextAreaField'

interface ActividadEditorProps {
  indice: number
  actividad: ActividadInforme
  errores: ErroresInforme
  onChange: (cambios: Partial<ActividadInforme>) => void
  onQuitar: () => void
}

export function ActividadEditor({ indice, actividad, errores, onChange, onQuitar }: ActividadEditorProps) {
  return (
    <section aria-labelledby={`${actividad.id}-titulo`} className="rounded-xl border border-line p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id={`${actividad.id}-titulo`} className="text-sm font-semibold text-primary">
          Actividad {indice + 1}
        </h3>
        <Button variant="ghost" size="sm" onClick={onQuitar} aria-label={`Quitar actividad ${indice + 1}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Quitar
        </Button>
      </div>

      <div className="space-y-4">
        <TextAreaField
          label="Actividad realizada"
          required
          rows={3}
          maxLength={MAX_DESCRIPCION}
          placeholder="Describe la actividad que realizaste en el periodo"
          value={actividad.descripcion}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          error={errores[`${actividad.id}.descripcion`]}
        />

        <SelectField
          label="Obligación contractual relacionada"
          value={actividad.obligacionId}
          onChange={(e) => onChange({ obligacionId: e.target.value })}
          hint="Lista provisional de ejemplo: no son obligaciones reales de tu contrato. Puedes dejarla sin seleccionar hasta que exista el módulo Contrato."
        >
          <option value="">Sin seleccionar (pendiente del módulo Contrato)</option>
          <optgroup label="Lista provisional de ejemplo">
            {obligacionesProvisionales.map((o) => (
              <option key={o.id} value={o.id}>
                {o.texto}
              </option>
            ))}
          </optgroup>
        </SelectField>

        <TextAreaField
          label="Resultado o producto obtenido"
          required
          rows={2}
          maxLength={MAX_RESULTADO}
          placeholder="Ej.: documento entregado, reunión realizada, base de datos actualizada…"
          value={actividad.resultado}
          onChange={(e) => onChange({ resultado: e.target.value })}
          error={errores[`${actividad.id}.resultado`]}
        />
      </div>
    </section>
  )
}
