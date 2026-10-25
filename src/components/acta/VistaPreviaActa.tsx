import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { FormAlert } from '../auth/FormAlert'
import { Button } from '../ui/Button'
import { buttonClass } from '../ui/styles'

interface VistaPreviaActaProps {
  url: string
  nombreArchivo: string
  bloquesMovidos: number
  onVolver: () => void
}

/** Vista previa del PDF generado en el navegador (URL local tipo blob: no se sube a ningún servidor). */
export function VistaPreviaActa({ url, nombreArchivo, bloquesMovidos, onVolver }: VistaPreviaActaProps) {
  return (
    <div className="space-y-4">
      <FormAlert variant="info">
        <strong>Revisa cada dato antes de descargar.</strong> Es un borrador basado en un formato de referencia: no
        está firmado, aprobado ni verificado por la entidad. Los espacios de firma deben diligenciarse manualmente.
        {bloquesMovidos > 0 && ' Para no cortar contenido, parte de los datos para pago continúa en la página 2.'}
      </FormAlert>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onVolver}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a editar
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary')}>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Abrir en pestaña nueva
        </a>
        <a href={url} download={nombreArchivo} className={buttonClass('primary')}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar PDF
        </a>
      </div>

      <iframe
        src={url}
        title="Vista previa del Acta de Ejecución Parcial"
        className="h-[75vh] min-h-[480px] w-full rounded-2xl border border-line bg-card shadow-card"
      />
      <p className="text-xs text-ink-muted">
        Si tu navegador no muestra la vista previa (frecuente en móviles), usa «Abrir en pestaña nueva».
      </p>
    </div>
  )
}
