import { Link } from 'react-router'
import { useCuentaCobro } from '../../cuenta/CuentaCobroContext'
import { useInformes } from '../../informes/InformesContext'
import { usePerfil } from '../../perfil/PerfilContext'
import type { DatosActa } from '../../types'
import {
  calcularValores,
  pesosActa,
  pideAmortizacion,
  pideIva,
  porcentajeActa,
  REGLAS_CALCULO,
  referenciaDeInforme,
  usarInforme,
  validarActa,
} from '../../utils/acta'
import { formatearCOP, soloDigitos } from '../../utils/perfil'
import { TextField } from '../auth/TextField'
import { SelectField } from '../ui/SelectField'

const PESOS: (keyof DatosActa)[] = ['valorCobrar', 'valorIva', 'valorAmortizar']

/**
 * Únicos datos que se piden para cada acta: los que cambian en cada cobro.
 * Escribe directamente en el estado compartido, así que nada se pierde al navegar.
 */
export function DatosActaForm({ revisar }: { revisar: boolean }) {
  const { perfil } = usePerfil()
  const { informes } = useInformes()
  const { acta, setActa } = useCuentaCobro()
  const errores = validarActa(acta, perfil)
  const v = calcularValores(acta, perfil)
  const informesPropios = informes.filter((i) => !i.esDemo)

  function campo(nombre: keyof DatosActa) {
    const valor = acta[nombre]
    return {
      value: valor,
      onChange: (e: { target: { value: string } }) =>
        setActa((a) => ({ ...a, [nombre]: PESOS.includes(nombre) ? soloDigitos(e.target.value) : e.target.value })),
      error: revisar || valor !== '' ? errores[nombre] : undefined,
    }
  }
  const pesosHint = (nombre: keyof DatosActa) => (acta[nombre] && !errores[nombre] ? formatearCOP(acta[nombre]) : undefined)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Número del acta" required {...campo('numeroActa')} />
        <TextField label="Fecha del acta" type="date" required {...campo('fechaActa')} />
        <TextField label="Ciudad donde se suscribe" required {...campo('ciudad')} />
        <TextField label="Periodo de cobro: desde" type="date" required min={perfil.fechaInicio || undefined} {...campo('periodoDesde')} />
        <TextField label="Periodo de cobro: hasta" type="date" required min={acta.periodoDesde || undefined} {...campo('periodoHasta')} />
        <TextField
          label="Valor a cobrar en este periodo"
          required
          inputMode="numeric"
          placeholder="Solo números"
          {...campo('valorCobrar')}
          hint={pesosHint('valorCobrar') ?? 'No se calcula a partir del valor del contrato.'}
        />

        {pideIva(perfil) && (
          <TextField label="Valor IVA de esta acta" required inputMode="numeric" placeholder="Solo números" {...campo('valorIva')} hint={pesosHint('valorIva')} />
        )}
        {pideAmortizacion(perfil) && (
          <>
            <TextField
              label="Valor a amortizar del anticipo"
              required
              inputMode="numeric"
              placeholder="0 si no corresponde"
              {...campo('valorAmortizar')}
              hint={pesosHint('valorAmortizar')}
            />
            <TextField label="Porcentaje de amortización" inputMode="decimal" placeholder="Ej.: 10" hint="Opcional." {...campo('porcentajeAmortizacion')} />
          </>
        )}
      </div>

      {/* IVA y amortización dependen de Mi perfil: se explica cuándo no se piden. */}
      <ul className="space-y-1 text-xs text-ink-muted">
        {perfil.responsableIva === 'no' && <li>IVA: 0, porque en Mi perfil indicaste que no eres responsable de IVA.</li>}
        {perfil.responsableIva === '' && (
          <li>
            IVA: indica en <Link to="/mi-perfil#revision-contrato" className="font-semibold text-action hover:underline">Mi perfil</Link> si eres responsable de IVA.
          </li>
        )}
        {perfil.anticipo === '0' && <li>Amortización: 0, porque en Mi perfil no se registró anticipo.</li>}
        {perfil.anticipo === '' && (
          <li>
            Amortización: registra en <Link to="/mi-perfil#revision-contrato" className="font-semibold text-action hover:underline">Mi perfil</Link> el anticipo del contrato (0 si no hubo).
          </li>
        )}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        {informesPropios.length > 0 && (
          <SelectField
            label="Usar un informe de esta sesión"
            value=""
            onChange={(e) => {
              const informe = informesPropios.find((i) => i.id === e.target.value)
              if (informe) setActa((a) => usarInforme(a, informe))
            }}
            hint="Copia su referencia y, si el periodo está vacío, sus fechas."
          >
            <option value="">Selecciona un informe…</option>
            {informesPropios.map((i) => (
              <option key={i.id} value={i.id}>
                {referenciaDeInforme(i)}
              </option>
            ))}
          </SelectField>
        )}
        <TextField label="Referencia del informe de actividades" hint="Opcional. Se cita en la constancia 3 del acta." maxLength={150} {...campo('referenciaInforme')} />
      </div>

      <div className="rounded-xl border border-line bg-canvas p-4">
        <h4 className="text-sm font-semibold text-primary">Resumen de valores</h4>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Valor total del contrato', Number.isFinite(v.valorTotal) ? pesosActa(v.valorTotal) : '—'],
            ['Porcentaje de anticipo', Number.isFinite(v.anticipoPorcentaje) ? porcentajeActa(v.anticipoPorcentaje) : '—'],
            ['Valor ejecutado', Number.isFinite(v.valorCobrar) ? pesosActa(v.valorCobrar) : '—'],
            ['Valor bruto ejecutado a pagar', Number.isFinite(v.bruto) ? pesosActa(v.bruto) : '—'],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{etiqueta}</dt>
              <dd className="mt-0.5 font-semibold text-primary">{valor}</dd>
            </div>
          ))}
        </dl>
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-ink">
          {REGLAS_CALCULO.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
