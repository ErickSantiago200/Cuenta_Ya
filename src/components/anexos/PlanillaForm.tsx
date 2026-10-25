import type { DatosPlanilla } from '../../types'
import { etiquetaPeriodo } from '../../utils/informes'
import { formatearCOP, soloDigitos } from '../../utils/perfil'
import { hoyISO, validarPlanilla } from '../../utils/soportes'
import { TextField } from '../auth/TextField'

const PESOS: (keyof DatosPlanilla)[] = ['ibc', 'valorSalud', 'valorPension', 'valorArl']

interface PlanillaFormProps {
  datos: DatosPlanilla
  onChange: (datos: DatosPlanilla) => void
  /** Mostrar también los errores de campos obligatorios vacíos. */
  revisar: boolean
}

/** Campos de la planilla, registrados manualmente por el contratista (no se leen del archivo). */
export function PlanillaForm({ datos, onChange, revisar }: PlanillaFormProps) {
  const hoy = hoyISO()
  const errores = validarPlanilla(datos, hoy)

  /** Errores de formato siempre; los de campo obligatorio, al revisar. */
  const ver = (campo: keyof DatosPlanilla) => (revisar || datos[campo] !== '' ? errores[campo] : undefined)

  function cambiar(campo: keyof DatosPlanilla, valor: string) {
    const limpio = PESOS.includes(campo) ? soloDigitos(valor) : valor
    const nuevo = { ...datos, [campo]: limpio }
    // El periodo de pensión suele coincidir con el de salud: se propone el mismo mientras no se cambie.
    if (campo === 'periodoSalud' && (datos.periodoPension === '' || datos.periodoPension === datos.periodoSalud)) {
      nuevo.periodoPension = limpio
    }
    onChange(nuevo)
  }

  const campo = (nombre: keyof DatosPlanilla) => ({
    value: datos[nombre],
    onChange: (e: { target: { value: string } }) => cambiar(nombre, e.target.value),
    error: ver(nombre),
  })
  const pesosHint = (nombre: keyof DatosPlanilla) =>
    datos[nombre] && !errores[nombre] ? formatearCOP(datos[nombre]) : undefined
  const periodoHint = (nombre: 'periodoSalud' | 'periodoPension') =>
    !ver(nombre) && datos[nombre] ? etiquetaPeriodo(datos[nombre]) : undefined

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Número de planilla" required inputMode="numeric" {...campo('numeroPlanilla')} />
        <TextField label="Número de planilla adicional" inputMode="numeric" hint="Solo si aplica." {...campo('planillaAdicional')} />
        <TextField label="Fecha de pago" type="date" required max={hoy} {...campo('fechaPago')} />
        <TextField label="Periodo de cotización de salud" type="month" required placeholder="AAAA-MM" {...campo('periodoSalud')} hint={periodoHint('periodoSalud')} />
        <TextField label="Periodo de cotización de pensión" type="month" required placeholder="AAAA-MM" {...campo('periodoPension')} hint={periodoHint('periodoPension')} />
        <TextField label="Ingreso base de cotización (IBC)" required inputMode="numeric" placeholder="Solo números" {...campo('ibc')} hint={pesosHint('ibc')} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-primary">Valores pagados y entidades (opcional)</h3>
        <p className="mb-3 mt-0.5 text-xs text-ink-muted">
          Se muestran en el acta cuando están disponibles. Si los dejas vacíos, el acta indicará «No registrado».
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label="Entidad promotora de salud (EPS)" {...campo('eps')} />
          <TextField label="Fondo de pensiones" {...campo('fondoPensiones')} />
          <TextField label="Administradora de riesgos laborales (ARL)" {...campo('arl')} />
          <TextField label="Valor pagado en salud" inputMode="numeric" placeholder="Solo números" {...campo('valorSalud')} hint={pesosHint('valorSalud')} />
          <TextField label="Valor pagado en pensión" inputMode="numeric" placeholder="Solo números" {...campo('valorPension')} hint={pesosHint('valorPension')} />
          <TextField label="Valor pagado en riesgos laborales" inputMode="numeric" placeholder="Solo números" {...campo('valorArl')} hint={pesosHint('valorArl')} />
        </div>
      </div>
    </div>
  )
}
