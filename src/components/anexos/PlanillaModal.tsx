import { useState } from 'react'
import { useCuentaCobro } from '../../cuenta/CuentaCobroContext'
import type { DatosPlanilla } from '../../types'
import { estadoPlanilla, faltantesPlanilla, hoyISO, validarPlanilla } from '../../utils/soportes'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'
import { Modal, ModalCuerpo, ModalPie } from '../ui/Modal'
import { ListaFaltantes } from './ListaFaltantes'
import { PlanillaForm } from './PlanillaForm'
import { RequisitoBadge } from './RequisitoBadge'

interface PlanillaModalProps {
  abierto: boolean
  onCerrar: () => void
}

export function PlanillaModal({ abierto, onCerrar }: PlanillaModalProps) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Datos de la Planilla de Seguridad Social"
      descripcion="Registra los datos tal como aparecen en tu planilla. Cuenta Ya no lee ni verifica el contenido del archivo."
    >
      <ContenidoPlanilla onCerrar={onCerrar} />
    </Modal>
  )
}

/** Se monta en cada apertura: trabaja sobre un borrador y solo modifica el estado compartido al guardar. */
function ContenidoPlanilla({ onCerrar }: { onCerrar: () => void }) {
  const { planilla, setPlanilla, archivos } = useCuentaCobro()
  const [borrador, setBorrador] = useState<DatosPlanilla>(planilla)
  const [revisar, setRevisar] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const archivo = archivos['seguridad-social'].estado
  const hoy = hoyISO()

  function guardar() {
    setPlanilla(borrador)
    // Si los datos están completos se cierra; si no, se guardan igualmente y se muestra lo que falta.
    if (Object.keys(validarPlanilla(borrador, hoy)).length === 0) {
      onCerrar()
      return
    }
    setRevisar(true)
    setGuardado(true)
  }

  const faltan = faltantesPlanilla(borrador, archivo, hoy)

  return (
    <>
      <ModalCuerpo>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Estado con estos datos:</span>
          <RequisitoBadge estado={estadoPlanilla(borrador, archivo, hoy)} />
          <span className="text-ink-muted">
            Soporte: {archivo.fase === 'valido' ? `«${archivo.archivo.nombre}» (formato válido)` : 'sin archivo válido; selecciónalo en la tarjeta'}
          </span>
        </div>
        <PlanillaForm
          datos={borrador}
          onChange={(d) => {
            setBorrador(d)
            setGuardado(false)
          }}
          revisar={revisar}
        />
      </ModalCuerpo>
      <ModalPie>
        <div aria-live="polite">
          {guardado && faltan.length > 0 && (
            <FormAlert variant="info">
              Datos guardados durante la sesión. Para completar el requisito aún falta:
              <ListaFaltantes mensajes={faltan} />
            </FormAlert>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCerrar}>
            {guardado ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button variant="secondary" onClick={() => setRevisar(true)}>
            Revisar datos
          </Button>
          <Button onClick={guardar}>Guardar datos</Button>
        </div>
      </ModalPie>
    </>
  )
}
