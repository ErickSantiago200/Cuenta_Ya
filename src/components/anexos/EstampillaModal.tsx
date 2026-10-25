import { useEffect, useRef, useState } from 'react'
import { useCuentaCobro } from '../../cuenta/CuentaCobroContext'
import type { DatosEstampillas } from '../../types'
import { estadoEstampillas, faltantesEstampillas, hoyISO, validarEstampillas } from '../../utils/soportes'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'
import { Modal, ModalCuerpo, ModalPie } from '../ui/Modal'
import { EstampillasForm } from './EstampillasForm'
import { ListaFaltantes } from './ListaFaltantes'
import { RequisitoBadge } from './RequisitoBadge'

interface EstampillaModalProps {
  abierto: boolean
  onCerrar: () => void
}

export function EstampillaModal({ abierto, onCerrar }: EstampillaModalProps) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Datos de la Estampilla"
      descripcion="Registra el tipo, número, fecha de pago y valor de cada estampilla, o márcala como «No requerida»."
    >
      <ContenidoEstampilla onCerrar={onCerrar} />
    </Modal>
  )
}

/** Se monta en cada apertura: trabaja sobre un borrador y solo modifica el estado compartido al guardar. */
function ContenidoEstampilla({ onCerrar }: { onCerrar: () => void }) {
  const { estampillas, setEstampillas, archivos, archivosEstampilla, quitarArchivosEstampilla } = useCuentaCobro()
  const [borrador, setBorrador] = useState<DatosEstampillas>(estampillas)
  const [revisar, setRevisar] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const hoy = hoyISO()

  // Los soportes de estampillas que pasaron por el borrador pero no se guardaron se descartan al cerrar.
  const [idsIniciales] = useState(() => estampillas.items.map((s) => s.id))
  const idsGuardados = useRef(idsIniciales)
  const idsVistos = useRef(new Set(idsIniciales))
  useEffect(() => {
    for (const s of borrador.items) idsVistos.current.add(s.id)
  }, [borrador])
  useEffect(
    () => () => {
      const huerfanos = [...idsVistos.current].filter((id) => !idsGuardados.current.includes(id))
      if (huerfanos.length) quitarArchivosEstampilla(huerfanos)
    },
    // quitarArchivosEstampilla es estable: la limpieza solo ocurre al cerrar (desmontar) el modal.
    [quitarArchivosEstampilla],
  )

  function guardar() {
    setEstampillas(borrador)
    const conservados = borrador.items.map((s) => s.id)
    // Soportes de estampillas eliminadas del borrador.
    const eliminados = Object.keys(archivosEstampilla).filter((id) => !conservados.includes(id))
    if (eliminados.length) quitarArchivosEstampilla(eliminados)
    idsGuardados.current = conservados

    if (Object.keys(validarEstampillas(borrador, hoy)).length === 0) {
      onCerrar()
      return
    }
    setRevisar(true)
    setGuardado(true)
  }

  const faltan = faltantesEstampillas(borrador, archivos.estampilla.estado, archivosEstampilla, hoy)

  return (
    <>
      <ModalCuerpo>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Estado con estos datos:</span>
          <RequisitoBadge estado={estadoEstampillas(borrador, archivos.estampilla.estado, archivosEstampilla, hoy)} />
        </div>
        <EstampillasForm
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
