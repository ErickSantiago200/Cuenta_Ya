import { FileImage, FileText, Loader2, RefreshCw, Upload, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { usePerfil } from '../../perfil/PerfilContext'
import { ACCEPT_FIRMA, formatBytes, validarArchivoFirma } from '../../utils/files'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'

/** Selección y validación local de la firma. No sube el archivo ni lo aplica a documentos. */
export function FirmaSelector() {
  const { firma, setFirma } = usePerfil()
  const [validando, setValidando] = useState<string | null>(null)
  const [error, setError] = useState<{ nombre: string; mensaje: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ultimaSeleccion = useRef(0)

  async function onArchivoSeleccionado(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Limpiar el valor permite volver a elegir el mismo archivo después de corregirlo.
    event.target.value = ''
    if (!file) return

    const seleccion = ++ultimaSeleccion.current
    setValidando(file.name)
    setError(null)
    const resultado = await validarArchivoFirma(file)
    if (seleccion !== ultimaSeleccion.current) return
    setValidando(null)

    if (resultado.ok) {
      setFirma({ file, nombre: file.name, tamano: file.size, formato: resultado.formato, mime: resultado.mime })
    } else {
      // Si falla, se conserva la firma anterior (si había una).
      setError({ nombre: file.name, mensaje: resultado.error })
    }
  }

  function quitar() {
    ultimaSeleccion.current++
    setValidando(null)
    setError(null)
    setFirma(null)
  }

  const IconoArchivo = firma?.formato === 'PDF' ? FileText : FileImage

  return (
    <div className="space-y-3">
      <FormAlert variant="info">
        <strong>La firma todavía no se aplica a ningún documento.</strong> El archivo solo se valida en tu
        navegador: no se sube ni se guarda, y se perderá al recargar la página.
      </FormAlert>

      <div aria-live="polite" className="space-y-3">
        {validando ? (
          <div className="flex items-center gap-2 rounded-xl bg-canvas px-4 py-4 text-sm text-ink">
            <Loader2 className="h-4 w-4 animate-spin text-action" aria-hidden="true" />
            <span className="truncate">Validando «{validando}»…</span>
          </div>
        ) : firma ? (
          <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <IconoArchivo className="h-8 w-8 shrink-0 text-action" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink" title={firma.nombre}>
                {firma.nombre}
              </p>
              <p className="text-xs text-ink-muted">
                {firma.formato} · {formatBytes(firma.tamano)} · Validada localmente, sin guardar
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-5 text-center text-sm text-ink">
            No has seleccionado una firma. Formatos: PDF, PNG o JPG · Máximo 10 MB.
          </div>
        )}

        {error && (
          <FormAlert variant="error">
            <span className="font-semibold">«{error.nombre}» no es válido.</span> {error.mensaje}
            {firma && ' Se conserva la firma seleccionada anteriormente.'}
          </FormAlert>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {firma ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={!!validando}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reemplazar firma
            </Button>
            <Button variant="ghost" size="sm" onClick={quitar}>
              <X className="h-4 w-4" aria-hidden="true" />
              Quitar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={!!validando}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Seleccionar firma
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_FIRMA}
        className="hidden"
        onChange={onArchivoSeleccionado}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
