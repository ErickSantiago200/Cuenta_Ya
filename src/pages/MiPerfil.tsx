import { CircleCheck, Clock, FilePen, FileText, PenLine, UserRound } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { FilasEditor } from '../components/acta/FilasEditor'
import { ArchivoInline } from '../components/anexos/ArchivoInline'
import { ListaFaltantes } from '../components/anexos/ListaFaltantes'
import { FormAlert } from '../components/auth/FormAlert'
import { TextField } from '../components/auth/TextField'
import { PrototypeNotice } from '../components/informes/PrototypeNotice'
import { FirmaSelector } from '../components/perfil/FirmaSelector'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TextAreaField } from '../components/ui/TextAreaField'
import { usePerfil } from '../perfil/PerfilContext'
import type { Adicion, CampoTextoPerfil, ModificacionPlazo, OtraModificacion, PerfilContratista } from '../types'
import { faltantesRevisionContrato, MAX_FILAS_MODIFICACION, validarContratoActa } from '../utils/acta'
import {
  CAMPOS_BASICOS,
  CAMPOS_CONTRATO,
  calcularDuracion,
  describirDuracion,
  formatearCOP,
  mismosCampos,
  soloDigitos,
  tomarCampos,
  validarPerfil,
} from '../utils/perfil'

function Seccion({ icono: Icono, titulo, children, id, extra }: { icono: typeof UserRound; titulo: string; children: ReactNode; id?: string; extra?: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-primary">
          <Icono className="h-5 w-5 text-action" aria-hidden="true" />
          {titulo}
        </h2>
        {extra && <span className="ml-auto">{extra}</span>}
      </div>
      {children}
    </section>
  )
}

type Aviso = { tipo: 'success' | 'error' | 'info'; texto: string } | null

const PESOS: CampoTextoPerfil[] = ['valorContrato', 'anticipo']
/** Anclas que usan la tarjeta del acta y el panel para llevar directamente a cada sección. */
export const ANCLA_BASICOS = 'datos-basicos'
export const ANCLA_REVISION = 'revision-contrato'

const nuevaPlazo = (): ModificacionPlazo => ({ id: crypto.randomUUID(), numero: '', tiempo: '', fechaInicial: '', fechaFinal: '' })
const nuevaAdicion = (): Adicion => ({ id: crypto.randomUUID(), numero: '', fecha: '', valor: '' })
const nuevaOtra = (): OtraModificacion => ({ id: crypto.randomUUID(), numero: '', fecha: '', observaciones: '' })

/** ¿Hay algún dato contractual registrado (aunque no se haya confirmado)? */
const hayDatosContrato = (p: PerfilContratista) =>
  CAMPOS_CONTRATO.some((c) => {
    const v = p[c]
    return Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v !== '' && !(c === 'representacion' && v === 'propia') : v
  })

export function MiPerfil() {
  // El borrador vive en el estado compartido: no se pierde al navegar antes de guardar o confirmar.
  const { perfil, aplicarCampos, borrador: datos, setBorrador: setDatos, minuta } = usePerfil()
  const { hash } = useLocation()
  const [revisarBasicos, setRevisarBasicos] = useState(false)
  const [intentoConfirmar, setIntentoConfirmar] = useState(false)
  const [avisoBasicos, setAvisoBasicos] = useState<Aviso>(null)
  const [avisoContrato, setAvisoContrato] = useState<Aviso>(null)

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  // --- Datos básicos ---
  const erroresBasicos = validarPerfil(datos)
  const cambiosBasicos = !mismosCampos(datos, perfil, CAMPOS_BASICOS)
  const duracion = calcularDuracion(datos.fechaInicio, datos.fechaTerminacion)
  const errorBasico = (c: CampoTextoPerfil) =>
    revisarBasicos || datos[c] !== '' ? erroresBasicos[c as keyof typeof erroresBasicos] : undefined

  // --- Datos contractuales (revisión de la minuta) ---
  const minutaValida = minuta.estado.fase === 'valido'
  const mostrarRevision = minutaValida || perfil.contratoConfirmado || hayDatosContrato(datos)
  // Al llegar desde el acta o al intentar confirmar se muestran también los datos que faltan.
  const revisarContrato = intentoConfirmar || hash === `#${ANCLA_REVISION}`
  const erroresFormato = validarContratoActa(datos, false)
  const erroresCompletos = validarContratoActa(datos, true)
  const visiblesContrato: Record<string, string | undefined> = revisarContrato ? erroresCompletos : erroresFormato
  const faltanContrato = faltantesRevisionContrato(datos)
  const cambiosContrato = !mismosCampos(datos, perfil, CAMPOS_CONTRATO)

  function campo<K extends keyof PerfilContratista>(nombre: K, valor: PerfilContratista[K]) {
    setDatos((d) => ({ ...d, [nombre]: valor }))
    setAvisoBasicos(null)
    setAvisoContrato(null)
  }
  const valorTexto = (nombre: CampoTextoPerfil, e: { target: { value: string } }) =>
    campo(nombre, PESOS.includes(nombre) ? soloDigitos(e.target.value) : e.target.value)

  const basico = (nombre: CampoTextoPerfil) => ({
    value: datos[nombre],
    onChange: (e: { target: { value: string } }) => valorTexto(nombre, e),
    error: errorBasico(nombre),
  })
  const contractual = (nombre: CampoTextoPerfil) => ({
    value: datos[nombre],
    onChange: (e: { target: { value: string } }) => valorTexto(nombre, e),
    error: visiblesContrato[nombre],
  })

  function guardarBasicos() {
    setRevisarBasicos(true)
    const total = Object.keys(erroresBasicos).length
    if (total) {
      setAvisoBasicos({ tipo: 'error', texto: `Hay ${total} ${total === 1 ? 'dato' : 'datos'} por completar o corregir.` })
      return
    }
    aplicarCampos(tomarCampos(datos, CAMPOS_BASICOS))
    setAvisoBasicos({ tipo: 'success', texto: 'Datos básicos guardados durante esta sesión. No se guardan de forma permanente.' })
  }

  function confirmarContrato() {
    setIntentoConfirmar(true)
    if (faltanContrato.length) {
      setAvisoContrato({
        tipo: 'error',
        texto: `Faltan ${faltanContrato.length} ${faltanContrato.length === 1 ? 'dato' : 'datos'} por completar o corregir antes de confirmar.`,
      })
      return
    }
    aplicarCampos({ ...tomarCampos(datos, CAMPOS_CONTRATO), contratoConfirmado: true })
    setAvisoContrato({
      tipo: 'success',
      texto: 'Datos contractuales confirmados durante esta sesión. Ya se usan en el panel principal y en el Acta de Ejecución Parcial.',
    })
  }

  function descartar(campos: readonly (keyof PerfilContratista)[]) {
    setDatos((d) => ({ ...d, ...tomarCampos(perfil, campos) }))
    setAvisoBasicos(null)
    setAvisoContrato(null)
  }

  const estadoContrato = !perfil.contratoConfirmado ? (
    <StatusBadge tone="warning" icon={Clock}>Sin confirmar</StatusBadge>
  ) : cambiosContrato ? (
    <StatusBadge tone="warning" icon={Clock}>Cambios sin confirmar</StatusBadge>
  ) : (
    <StatusBadge tone="info" icon={CircleCheck}>Confirmados</StatusBadge>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink">
            Registra tus datos básicos, adjunta la minuta de tu contrato y confirma los datos contractuales. Lo confirmado se
            usa en el panel principal y en el Acta de Ejecución Parcial.
          </p>
        </div>
        <PrototypeNotice />
        <p className="text-sm text-ink">
          Los campos marcados con <span className="text-danger">*</span> son obligatorios.
        </p>
      </header>

      {/* 1. Datos básicos */}
      <Seccion icono={UserRound} titulo="Datos básicos" id={ANCLA_BASICOS}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nombre" required autoComplete="given-name" {...basico('nombres')} />
          <TextField label="Apellido" required autoComplete="family-name" {...basico('apellidos')} />
          <TextField label="Número de identificación" required hint="Sin puntos ni espacios." {...basico('numeroIdentificacion')} />
          <TextField label="Número de contrato" required {...basico('numeroContrato')} />
          <TextField label="Fecha de inicio del contrato" type="date" required {...basico('fechaInicio')} />
          <TextField label="Fecha de finalización del contrato" type="date" required min={datos.fechaInicio || undefined} {...basico('fechaTerminacion')} />
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-ink">Duración</p>
            <div className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink" aria-live="polite">
              {duracion ? (
                <>
                  <span className="font-semibold text-primary">{describirDuracion(duracion)}</span>{' '}
                  <span className="text-ink-muted">({duracion.totalDias.toLocaleString('es-CO')} días calendario, incluido el día de terminación)</span>
                </>
              ) : (
                <span className="text-ink-muted">Se calculará cuando ingreses fechas de inicio y finalización válidas.</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div aria-live="polite">{avisoBasicos && <FormAlert variant={avisoBasicos.tipo}>{avisoBasicos.texto}</FormAlert>}</div>
          {cambiosBasicos && !avisoBasicos && (
            <p className="text-xs text-ink-muted">Tienes cambios sin guardar; se conservan mientras navegas por Cuenta Ya.</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => descartar(CAMPOS_BASICOS)} disabled={!cambiosBasicos}>
              Descartar cambios
            </Button>
            <Button onClick={guardarBasicos}>Guardar datos básicos</Button>
          </div>
        </div>
      </Seccion>

      {/* 2. Minuta */}
      <Seccion icono={FileText} titulo="Minuta del contrato" id="minuta">
        <p className="mb-3 text-sm text-ink">
          Adjunta la minuta de tu contrato en PDF o Word (máximo 10 MB) para revisar a partir de ella los datos contractuales.
        </p>
        <FormAlert variant="info">
          <strong>Cuenta Ya todavía no lee el contenido de la minuta</strong>: no extrae datos automáticamente. Después de
          adjuntarla, revisa el documento y completa o corrige manualmente los datos contractuales. El archivo solo se valida
          en tu navegador: no se sube ni se guarda, y se pierde al recargar la página.
        </FormAlert>
        <div className="mt-3">
          <ArchivoInline etiqueta="Minuta" estado={minuta.estado} onSeleccionar={(f) => void minuta.seleccionar(f)} onQuitar={minuta.quitar} />
        </div>
      </Seccion>

      {/* 3. Revisión y confirmación de datos contractuales */}
      <Seccion icono={FilePen} titulo="Revisión de datos contractuales" id={ANCLA_REVISION} extra={mostrarRevision ? estadoContrato : undefined}>
        {!mostrarRevision ? (
          <p className="rounded-xl border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-ink">
            Adjunta la minuta para revisar y confirmar los datos contractuales.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink">
              Formulario precargado con los datos que ya tienes registrados. Compáralo con la minuta, completa lo que falte y
              confírmalo: hasta que lo confirmes, el panel y el acta siguen usando los datos anteriores.
            </p>
            {faltanContrato.length > 0 && (
              <div className="mb-4 rounded-xl border border-accent/50 bg-accent-soft/60 p-3 text-sm text-ink">
                <p className="font-semibold text-primary">Datos por completar ({faltanContrato.length})</p>
                <ListaFaltantes mensajes={faltanContrato} max={8} />
              </div>
            )}

            <h3 className="mb-3 text-sm font-semibold text-primary">Datos generales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Entidad contratante" required {...contractual('entidadContratante')} />
              <TextField label="Dependencia" required {...contractual('dependenciaContrato')} />
              <div className="sm:col-span-2">
                <TextAreaField label="Objeto contractual" required rows={3} maxLength={2000} {...contractual('objetoContractual')} />
              </div>
              <TextField
                label="Valor del contrato (COP)"
                required
                inputMode="numeric"
                placeholder="Solo números, sin puntos"
                {...contractual('valorContrato')}
                hint={datos.valorContrato && Number(datos.valorContrato) > 0 ? formatearCOP(datos.valorContrato) : undefined}
              />
              <TextField label="Vigencia" inputMode="numeric" maxLength={4} placeholder="AAAA" hint="Opcional. Año, p. ej. 2026." {...contractual('vigencia')} />
              <TextField label="Tipo de contrato" required placeholder="Como figura en la minuta" {...contractual('tipoContrato')} />
              <TextField label="Fecha de suscripción del contrato" type="date" required {...contractual('fechaContrato')} />
              <TextField label="NIT de la entidad contratante" hint="Opcional." {...contractual('nitContratante')} />
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium text-ink">Representación del contratista</legend>
              <div className="flex flex-wrap gap-2">
                {([['propia', 'Representación propia (persona natural)'], ['representante', 'Tiene representante legal']] as const).map(([valor, etiqueta]) => (
                  <label
                    key={valor}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      datos.representacion === valor ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink hover:bg-canvas'
                    }`}
                  >
                    <input type="radio" name="representacion" checked={datos.representacion === valor} onChange={() => campo('representacion', valor)} className="accent-action" />
                    {etiqueta}
                  </label>
                ))}
              </div>
            </fieldset>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-primary">Supervisor y ordenador del gasto</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {datos.representacion === 'representante' && (
                <>
                  <TextField label="Nombre del representante legal" required {...contractual('representanteNombre')} />
                  <TextField label="C.C./NIT del representante legal" required {...contractual('representanteIdentificacion')} />
                  <div className="hidden lg:block" aria-hidden="true" />
                </>
              )}
              <TextField label="Nombre del supervisor" required {...contractual('supervisorNombre')} />
              <TextField label="C.C./NIT del supervisor" required {...contractual('supervisorIdentificacion')} />
              <div className="hidden lg:block" aria-hidden="true" />
              <TextField label="Nombre del ordenador del gasto" required {...contractual('ordenadorNombre')} />
              <TextField label="Cargo del ordenador del gasto" required {...contractual('ordenadorCargo')} />
              <TextField label="C.C. del ordenador del gasto" required inputMode="numeric" {...contractual('ordenadorIdentificacion')} />
            </div>

            <h3 className="mb-3 mt-6 text-sm font-semibold text-primary">Registros presupuestales (CDP y RP)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Número del CDP" required {...contractual('cdpNumero')} />
              <TextField label="Fecha del CDP" type="date" required {...contractual('cdpFecha')} />
              <TextField label="Número del RP" required {...contractual('rpNumero')} />
              <TextField label="Fecha del RP" type="date" required {...contractual('rpFecha')} />
            </div>
            {(['cdp', 'rp'] as const).map((tipo) => {
              const aplica = tipo === 'cdp' ? 'cdpAdicionalAplica' : 'rpAdicionalAplica'
              const numero = tipo === 'cdp' ? 'cdpAdicionalNumero' : 'rpAdicionalNumero'
              const fecha = tipo === 'cdp' ? 'cdpAdicionalFecha' : 'rpAdicionalFecha'
              const nombre = tipo.toUpperCase()
              return (
                <div key={tipo} className="mt-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={datos[aplica]} onChange={(e) => campo(aplica, e.target.checked)} className="h-4 w-4 accent-action" />
                    Hay {nombre} adicional
                  </label>
                  {datos[aplica] && (
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <TextField label={`Número del ${nombre} adicional`} required {...contractual(numero)} />
                      <TextField label={`Fecha del ${nombre} adicional`} type="date" required {...contractual(fecha)} />
                    </div>
                  )}
                </div>
              )
            })}

            <h3 className="mb-3 mt-6 text-sm font-semibold text-primary">Anticipo, IVA y pólizas</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Anticipo o pago anticipado del contrato"
                required
                inputMode="numeric"
                placeholder="0 si no hubo"
                {...contractual('anticipo')}
                hint={datos.anticipo === '0' ? 'Sin anticipo: el acta no pedirá amortización.' : datos.anticipo ? formatearCOP(datos.anticipo) : undefined}
              />
              <TextField label="Fecha de aprobación de pólizas" type="date" hint="Opcional; si no aplica, déjala vacía." {...contractual('fechaAprobacionPolizas')} />
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-ink">
                ¿Eres responsable de IVA?<span className="ml-0.5 text-danger" aria-hidden="true">*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {([['no', 'No: el IVA del acta es 0'], ['si', 'Sí: indicaré el IVA en cada acta']] as const).map(([valor, etiqueta]) => (
                  <label
                    key={valor}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      datos.responsableIva === valor ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink hover:bg-canvas'
                    }`}
                  >
                    <input type="radio" name="responsable-iva" checked={datos.responsableIva === valor} onChange={() => campo('responsableIva', valor)} className="accent-action" />
                    {etiqueta}
                  </label>
                ))}
              </div>
              {visiblesContrato.responsableIva && <p className="mt-1.5 text-xs font-medium text-danger">{visiblesContrato.responsableIva}</p>}
            </fieldset>

            <h3 className="mb-1 mt-6 text-sm font-semibold text-primary">Modificaciones del contrato</h3>
            <p className="mb-3 text-xs text-ink-muted">Regístralas solo si existen; si no, el acta mostrará «No Aplica».</p>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <TextField label="Nueva fecha de terminación" type="date" hint="Solo si hubo prórroga." {...contractual('nuevaFechaTerminacion')} />
            </div>
            <div className="space-y-3">
              <FilasEditor
                titulo="Suspensiones"
                filas={datos.suspensiones}
                columnas={[
                  { campo: 'numero', etiqueta: 'No.' },
                  { campo: 'tiempo', etiqueta: 'Tiempo', placeholder: 'Ej.: 15 días' },
                  { campo: 'fechaInicial', etiqueta: 'Fecha inicial', tipo: 'fecha' },
                  { campo: 'fechaFinal', etiqueta: 'Fecha final', tipo: 'fecha' },
                ]}
                nueva={nuevaPlazo}
                onChange={(filas) => campo('suspensiones', filas)}
                errores={erroresCompletos}
                mostrarErrores={revisarContrato}
                max={MAX_FILAS_MODIFICACION}
              />
              <FilasEditor
                titulo="Prórrogas"
                filas={datos.prorrogas}
                columnas={[
                  { campo: 'numero', etiqueta: 'No.' },
                  { campo: 'tiempo', etiqueta: 'Tiempo', placeholder: 'Ej.: 1 mes' },
                  { campo: 'fechaInicial', etiqueta: 'Fecha inicial', tipo: 'fecha' },
                  { campo: 'fechaFinal', etiqueta: 'Fecha final', tipo: 'fecha' },
                ]}
                nueva={nuevaPlazo}
                onChange={(filas) => campo('prorrogas', filas)}
                errores={erroresCompletos}
                mostrarErrores={revisarContrato}
                max={MAX_FILAS_MODIFICACION}
              />
              <FilasEditor
                titulo="Adiciones"
                filas={datos.adiciones}
                columnas={[
                  { campo: 'numero', etiqueta: 'No.' },
                  { campo: 'fecha', etiqueta: 'Fecha de la adición', tipo: 'fecha' },
                  { campo: 'valor', etiqueta: 'Valor adicionado', tipo: 'pesos', placeholder: 'Solo números' },
                ]}
                nueva={nuevaAdicion}
                onChange={(filas) => campo('adiciones', filas)}
                errores={erroresCompletos}
                mostrarErrores={revisarContrato}
                max={MAX_FILAS_MODIFICACION}
              />
              <FilasEditor
                titulo="Cesión, otrosí o aclaraciones"
                filas={datos.otrasModificaciones}
                columnas={[
                  { campo: 'numero', etiqueta: 'No.' },
                  { campo: 'fecha', etiqueta: 'Fecha de la modificación', tipo: 'fecha' },
                  { campo: 'observaciones', etiqueta: 'Observaciones' },
                ]}
                nueva={nuevaOtra}
                onChange={(filas) => campo('otrasModificaciones', filas)}
                errores={erroresCompletos}
                mostrarErrores={revisarContrato}
                max={MAX_FILAS_MODIFICACION}
              />
            </div>

            <div className="mt-5 space-y-3">
              <div aria-live="polite">
                {avisoContrato && (
                  <FormAlert variant={avisoContrato.tipo}>
                    {avisoContrato.texto}{' '}
                    {avisoContrato.tipo === 'success' && (
                      <Link to="/documentos-anexos#acta-ejecucion" className="font-semibold underline">
                        Ir al acta
                      </Link>
                    )}
                  </FormAlert>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={() => descartar(CAMPOS_CONTRATO)} disabled={!cambiosContrato}>
                  Descartar cambios
                </Button>
                <Button onClick={confirmarContrato}>Confirmar datos contractuales</Button>
              </div>
            </div>
          </>
        )}
      </Seccion>

      <Seccion icono={PenLine} titulo="Firma">
        <FirmaSelector />
      </Seccion>
    </div>
  )
}
