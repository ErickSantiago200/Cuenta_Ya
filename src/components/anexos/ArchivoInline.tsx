import { FileText, Loader2, Upload, X } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import type { EstadoValidacion } from '../../hooks/useValidacionAnexo'
import { ACCEPT_ANEXOS, formatBytes } from '../../utils/files'
import { Button } from '../ui/Button'

interface ArchivoInlineProps {
  etiqueta: string
  estado: EstadoValidacion | undefined
  onSeleccionar: (file: File) => void
  onQuitar: () => void
}

/** Selector compacto de un soporte (PDF, DOC o DOCX ≤ 10 MB), validado localmente y sin subirlo. */
export function ArchivoInline({ etiqueta, estado = { fase: 'vacio' }, onSeleccionar, onQuitar }: ArchivoInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function onCambio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onSeleccionar(file)
  }

  return (
    <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-3 py-2.5" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">{etiqueta}:</span>
        {estado.fase === 'valido' ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-ink">
            <FileText className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
            <span className="truncate" title={estado.archivo.nombre}>{estado.archivo.nombre}</span>
            <span className="text-xs text-ink-muted">({formatBytes(estado.archivo.tamano)}, formato válido, sin guardar)</span>
          </span>
        ) : estado.fase === 'validando' ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink">
            <Loader2 className="h-4 w-4 animate-spin text-action" aria-hidden="true" />
            Validando…
          </span>
        ) : (
          <span className="text-sm text-ink-muted">Sin archivo</span>
        )}
        <span className="ml-auto flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={estado.fase === 'validando'}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {estado.fase === 'valido' ? 'Cambiar' : 'Seleccionar archivo'}
          </Button>
          {estado.fase === 'valido' && (
            <Button variant="ghost" size="sm" onClick={onQuitar} aria-label={`Quitar ${etiqueta.toLowerCase()}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </span>
      </div>
      {estado.fase === 'invalido' && (
        <p className="mt-1.5 text-xs font-medium text-danger">
          «{estado.nombre}» no es válido. {estado.error}
        </p>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT_ANEXOS} className="hidden" onChange={onCambio} aria-hidden="true" tabIndex={-1} />
    </div>
  )
}
