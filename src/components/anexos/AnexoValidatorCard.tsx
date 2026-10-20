import { CircleAlert, CircleCheck, CircleDashed, FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { useId, useRef, type ChangeEvent } from 'react'
import type { DefinicionAnexo } from '../../data/anexos'
import { useValidacionAnexo, type EstadoValidacion } from '../../hooks/useValidacionAnexo'
import { ACCEPT_ANEXOS, formatBytes } from '../../utils/files'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'

function Estado({ estado }: { estado: EstadoValidacion }) {
  switch (estado.fase) {
    case 'vacio':
      return <StatusBadge tone="neutral" icon={CircleDashed}>Sin archivo</StatusBadge>
    case 'validando':
      return <StatusBadge tone="info" icon={Loader2}>Validando…</StatusBadge>
    case 'valido':
      return <StatusBadge tone="success" icon={CircleCheck}>Validado localmente, sin guardar</StatusBadge>
    case 'invalido':
      return <StatusBadge tone="danger" icon={CircleAlert}>No válido</StatusBadge>
  }
}

export function AnexoValidatorCard({ anexo }: { anexo: DefinicionAnexo }) {
  const { estado, seleccionar, quitar } = useValidacionAnexo()
  const inputRef = useRef<HTMLInputElement>(null)
  const tituloId = useId()
  const { icono: Icono } = anexo

  function onArchivoSeleccionado(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpiar el valor permite volver a elegir el mismo archivo después de corregirlo.
    event.target.value = ''
    if (file) void seleccionar(file)
  }

  return (
    <article aria-labelledby={tituloId} className="flex flex-col rounded-2xl border border-line bg-card p-5 shadow-card">
      <header className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Icono className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id={tituloId} className="font-semibold text-primary">
            {anexo.titulo}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">PDF, DOC o DOCX · Máximo 10 MB</p>
        </div>
      </header>

      <div className="mt-3">
        <Estado estado={estado} />
      </div>

      <div className="mt-3 flex-1 space-y-3" aria-live="polite">
        {estado.fase === 'valido' ? (
          <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <FileText className="h-8 w-8 shrink-0 text-action" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink" title={estado.archivo.nombre}>
                {estado.archivo.nombre}
              </p>
              <p className="text-xs text-ink-muted">
                {estado.archivo.formato} · {formatBytes(estado.archivo.tamano)}
              </p>
            </div>
          </div>
        ) : estado.fase === 'validando' ? (
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-4 text-sm text-ink">
            <Loader2 className="h-4 w-4 animate-spin text-action" aria-hidden="true" />
            <span className="truncate">Validando «{estado.nombre}»…</span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-4 text-center text-sm text-ink">
            Ningún archivo seleccionado.
          </div>
        )}

        {estado.fase === 'valido' && (
          <FormAlert variant="success">
            El archivo cumple los requisitos. Solo se revisó en tu navegador: no se ha subido ni guardado.
          </FormAlert>
        )}
        {estado.fase === 'invalido' && (
          <FormAlert variant="error">
            <span className="font-semibold">«{estado.nombre}» no es válido.</span> {estado.error}
          </FormAlert>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {estado.fase === 'valido' ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Cambiar archivo
            </Button>
            <Button variant="ghost" size="sm" onClick={quitar}>
              <X className="h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={estado.fase === 'validando'}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {estado.fase === 'invalido' ? 'Seleccionar otro archivo' : 'Seleccionar archivo'}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ANEXOS}
        className="hidden"
        onChange={onArchivoSeleccionado}
        aria-hidden="true"
        tabIndex={-1}
      />
    </article>
  )
}
