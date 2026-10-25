import type { LucideIcon } from 'lucide-react'

/** Estados preliminares del flujo de informes (pendiente de validación funcional). */
export type EstadoInforme = 'Borrador' | 'Enviado' | 'En revisión' | 'Requiere ajustes' | 'Aprobado'

/** Fila del resumen del panel principal (datos de demostración). `Pendiente`: periodo sin informe. */
export interface ResumenInforme {
  id: number
  numero: number
  periodo: string
  fechaEnvio: string | null
  valor: string
  estado: EstadoInforme | 'Pendiente'
}

export interface ObligacionContractual {
  id: string
  texto: string
}

export interface ActividadInforme {
  id: string
  descripcion: string
  /** Id de la obligación relacionada; cadena vacía = sin seleccionar. */
  obligacionId: string
  resultado: string
}

/** Campos editables de un informe de actividades. */
export interface DatosInforme {
  /** Mes del periodo en formato AAAA-MM. */
  periodo: string
  /** Fechas en formato AAAA-MM-DD. */
  fechaInicio: string
  fechaFin: string
  actividades: ActividadInforme[]
  observaciones: string
}

export interface InformeActividades extends DatosInforme {
  id: string
  /** Número consecutivo de la sesión; `null` en los ejemplos de demostración. */
  numero: number | null
  estado: EstadoInforme
  actualizado: Date
  /** Ejemplo visual: no corresponde a un informe real y no se puede editar. */
  esDemo: boolean
}

export interface Indicador {
  id: string
  titulo: string
  valor: string
  detalle: string
  icono: LucideIcon
  /** El dato aún no está disponible: se muestra atenuado. */
  pendiente?: boolean
}

/** Datos de la planilla de seguridad social. Valores en pesos: solo dígitos. Periodos: AAAA-MM. */
export interface DatosPlanilla {
  numeroPlanilla: string
  periodoSalud: string
  periodoPension: string
  fechaPago: string
  planillaAdicional: string
  ibc: string
  valorSalud: string
  valorPension: string
  valorArl: string
  eps: string
  fondoPensiones: string
  arl: string
}

export interface Estampilla {
  id: string
  tipo: string
  numero: string
  fechaPago: string
  /** Pesos, solo dígitos. */
  valor: string
}

export interface DatosEstampillas {
  /** '' = aún no se ha indicado si el contrato requiere estampillas. */
  requerida: '' | 'si' | 'no'
  items: Estampilla[]
}

/** Suspensión o prórroga del contrato. */
export interface ModificacionPlazo {
  id: string
  numero: string
  tiempo: string
  fechaInicial: string
  fechaFinal: string
}

export interface Adicion {
  id: string
  numero: string
  fecha: string
  /** Pesos, solo dígitos. */
  valor: string
}

/** Cesión, otrosí o aclaración. */
export interface OtraModificacion {
  id: string
  numero: string
  fecha: string
  observaciones: string
}

/**
 * Datos EXCLUSIVOS de cada Acta de Ejecución Parcial (cambian en cada cobro).
 * Los datos del contratista y del contrato se toman de Mi perfil; los de seguridad social y estampillas, de sus formularios.
 * Valores en pesos: solo dígitos.
 */
export interface DatosActa {
  numeroActa: string
  fechaActa: string
  ciudad: string
  periodoDesde: string
  periodoHasta: string
  valorCobrar: string
  /** Solo se pide si el contratista es responsable de IVA (Mi perfil). */
  valorIva: string
  /** Solo se pide si hubo anticipo (Mi perfil). */
  valorAmortizar: string
  /** Opcional; solo se muestra si se indica. */
  porcentajeAmortizacion: string
  referenciaInforme: string
}

export type TipoIdentificacion = 'CC' | 'CE' | 'PPT' | 'PA'

/** Datos del contratista diligenciados en Mi perfil (por ahora solo en memoria). */
export interface PerfilContratista {
  // Datos básicos (los registra el contratista)
  nombres: string
  apellidos: string
  /** Se calcula a partir de nombres y apellidos al aplicar el perfil. */
  nombreCompleto: string
  tipoIdentificacion: TipoIdentificacion | ''
  numeroIdentificacion: string
  correo: string
  telefono: string
  dependenciaPersonal: string
  // Información contractual
  numeroContrato: string
  /** Año de la vigencia (AAAA). */
  vigencia: string
  entidadContratante: string
  dependenciaContrato: string
  objetoContractual: string
  /** Valor en pesos, solo dígitos. */
  valorContrato: string
  /** Fechas en formato AAAA-MM-DD. */
  fechaInicio: string
  fechaTerminacion: string
  // Datos del contrato para actas: se registran una vez y se reutilizan en cada acta.
  tipoContrato: string
  /** Fecha de suscripción del contrato. */
  fechaContrato: string
  nitContratante: string
  representacion: 'propia' | 'representante'
  representanteNombre: string
  representanteIdentificacion: string
  ordenadorNombre: string
  ordenadorCargo: string
  ordenadorIdentificacion: string
  supervisorNombre: string
  supervisorIdentificacion: string
  /** Anticipo o pago anticipado del contrato, en pesos (0 si no hubo). */
  anticipo: string
  /** Si el contratista es responsable de IVA: determina si el acta pide el valor del IVA. */
  responsableIva: '' | 'si' | 'no'
  cdpNumero: string
  cdpFecha: string
  cdpAdicionalAplica: boolean
  cdpAdicionalNumero: string
  cdpAdicionalFecha: string
  rpNumero: string
  rpFecha: string
  rpAdicionalAplica: boolean
  rpAdicionalNumero: string
  rpAdicionalFecha: string
  /** Solo si hubo prórroga. */
  nuevaFechaTerminacion: string
  suspensiones: ModificacionPlazo[]
  prorrogas: ModificacionPlazo[]
  adiciones: Adicion[]
  otrasModificaciones: OtraModificacion[]
  fechaAprobacionPolizas: string
  /** El contratista revisó y confirmó los datos contractuales (de la minuta); solo entonces se usan en documentos. */
  contratoConfirmado: boolean
}

/** Campos de texto de Mi perfil (excluye listas y casillas). */
export type CampoTextoPerfil = {
  [K in keyof PerfilContratista]: PerfilContratista[K] extends string ? K : never
}[keyof PerfilContratista]

export interface ItemMenu {
  id: string
  etiqueta: string
  icono: LucideIcon
  /** Ruta del módulo; si falta, el módulo aún no está implementado. */
  ruta?: string
}
