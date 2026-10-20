import { AnexoValidatorCard } from '../components/anexos/AnexoValidatorCard'
import { FormAlert } from '../components/auth/FormAlert'
import { anexos } from '../data/anexos'

export function DocumentosAnexos() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Documentos Anexos</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink">
          Comprueba que tus soportes cumplan los requisitos antes de presentarlos: PDF (.pdf) o Word (.doc,
          .docx) de hasta 10 MB por archivo.
        </p>
      </header>

      <FormAlert variant="info">
        <strong>Validación local, sin almacenamiento.</strong> Los archivos se revisan en tu navegador; no se
        suben a ningún servidor ni se guardan. Si recargas la página o sales de ella, tendrás que
        seleccionarlos de nuevo.
      </FormAlert>

      <div className="grid gap-5 md:grid-cols-2">
        {anexos.map((anexo) => (
          <AnexoValidatorCard key={anexo.tipo} anexo={anexo} />
        ))}
      </div>
    </div>
  )
}
