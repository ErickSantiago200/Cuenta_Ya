import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  abierto: boolean
  /** Se llama al pulsar la X o Esc. */
  onCerrar: () => void
  titulo: string
  descripcion?: string
  /** Contenido; se monta solo mientras el modal está abierto (cada apertura empieza limpia). */
  children: ReactNode
}

/**
 * Diálogo modal accesible basado en <dialog>: showModal() gestiona el foco, la tecla Esc
 * y bloquea la interacción con el resto de la página.
 */
export function Modal({ abierto, onCerrar, titulo, descripcion, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const tituloId = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      className="m-auto max-h-[92vh] w-[calc(100%-1.5rem)] max-w-4xl overflow-hidden rounded-2xl border border-line bg-card p-0 text-ink shadow-raised backdrop:bg-primary/50"
    >
      {abierto && (
        <div className="flex max-h-[92vh] flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 id={tituloId} className="text-lg font-semibold text-primary">
                {titulo}
              </h2>
              {descripcion && <p className="mt-0.5 text-sm text-ink">{descripcion}</p>}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

/** Zona desplazable del contenido del modal. */
export function ModalCuerpo({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
}

/** Pie fijo del modal para las acciones. */
export function ModalPie({ children }: { children: ReactNode }) {
  return <footer className="space-y-3 border-t border-line bg-canvas/60 px-5 py-3">{children}</footer>
}
