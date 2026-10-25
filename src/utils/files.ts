/** Límite por archivo (Documentos Anexos y firma). */
export const MAX_ANEXO_BYTES = 10 * 1024 * 1024

interface FormatoArchivo {
  etiqueta: string
  /** Tipos MIME que los navegadores/sistemas suelen informar para esta extensión. */
  mimes: string[]
  /** Comprueba la firma binaria (primeros bytes) del archivo. */
  firmaValida: (bytes: Uint8Array) => boolean
}

const empiezaCon = (bytes: Uint8Array, firma: number[]) => firma.every((b, i) => bytes[i] === b)

/** "%PDF-" puede aparecer tras algunos bytes iniciales; la especificación lo admite en el primer KB. */
function contienePdfHeader(bytes: Uint8Array): boolean {
  const firma = [0x25, 0x50, 0x44, 0x46, 0x2d]
  for (let i = 0; i + firma.length <= bytes.length; i++) {
    if (firma.every((b, j) => bytes[i + j] === b)) return true
  }
  return false
}

const JPEG: FormatoArchivo = {
  etiqueta: 'JPG',
  mimes: ['image/jpeg', 'image/pjpeg'],
  firmaValida: (b) => empiezaCon(b, [0xff, 0xd8, 0xff]),
}

const FORMATOS: Record<string, FormatoArchivo> = {
  pdf: {
    etiqueta: 'PDF',
    mimes: ['application/pdf', 'application/x-pdf'],
    firmaValida: contienePdfHeader,
  },
  doc: {
    etiqueta: 'Word (.doc)',
    mimes: ['application/msword', 'application/vnd.ms-word', 'application/x-msword'],
    // Contenedor OLE2 de Office 97-2003
    firmaValida: (b) => empiezaCon(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  docx: {
    etiqueta: 'Word (.docx)',
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    // Contenedor ZIP de Office Open XML
    firmaValida: (b) => empiezaCon(b, [0x50, 0x4b, 0x03, 0x04]),
  },
  png: {
    etiqueta: 'PNG',
    mimes: ['image/png'],
    firmaValida: (b) => empiezaCon(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  jpg: JPEG,
  jpeg: JPEG,
}

/** Reglas de cada uso: extensiones permitidas y cómo se nombran en los mensajes. */
interface ReglasArchivo {
  extensiones: string[]
  descripcion: string
}

const REGLAS_ANEXOS: ReglasArchivo = { extensiones: ['pdf', 'doc', 'docx'], descripcion: 'PDF (.pdf) o Word (.doc, .docx)' }
const REGLAS_FIRMA: ReglasArchivo = { extensiones: ['pdf', 'png', 'jpg', 'jpeg'], descripcion: 'PDF, PNG o JPG' }

/** Tipos que algunos sistemas informan cuando no reconocen el archivo: se decide por extensión y firma. */
const MIME_GENERICOS = ['', 'application/octet-stream']

function acceptPara({ extensiones }: ReglasArchivo): string {
  const mimes = new Set(extensiones.flatMap((e) => FORMATOS[e].mimes))
  return [...extensiones.map((e) => `.${e}`), ...mimes].join(',')
}

export const ACCEPT_ANEXOS = acceptPara(REGLAS_ANEXOS)
export const ACCEPT_FIRMA = acceptPara(REGLAS_FIRMA)

export type ValidacionArchivo =
  | { ok: true; formato: string; mime: string }
  | { ok: false; error: string }

function extensionDe(nombre: string): string {
  const partes = nombre.split('.')
  return partes.length > 1 ? partes.pop()!.toLowerCase() : ''
}

/**
 * Valida un archivo localmente, sin subirlo ni guardarlo:
 * extensión, tipo MIME, archivo vacío, tamaño y firma binaria (lee solo el primer KB en memoria).
 */
async function validarArchivo(file: File, reglas: ReglasArchivo): Promise<ValidacionArchivo> {
  const extension = extensionDe(file.name)
  const formato = reglas.extensiones.includes(extension) ? FORMATOS[extension] : undefined

  if (!formato) {
    return {
      ok: false,
      error: extension
        ? `Los archivos .${extension} no están permitidos. Usa ${reglas.descripcion}.`
        : `El archivo no tiene extensión. Usa ${reglas.descripcion}.`,
    }
  }
  if (!MIME_GENERICOS.includes(file.type) && !formato.mimes.includes(file.type)) {
    return {
      ok: false,
      error: `El tipo del archivo (${file.type}) no corresponde a un ${formato.etiqueta}. Verifica que la extensión sea la correcta.`,
    }
  }
  if (file.size === 0) {
    return { ok: false, error: 'El archivo está vacío (0 bytes). Selecciona otro archivo.' }
  }
  if (file.size > MAX_ANEXO_BYTES) {
    // Evita el confuso "pesa 10 MB y supera 10 MB" cuando el exceso desaparece al redondear.
    const peso = formatBytes(file.size)
    return {
      ok: false,
      error: `El archivo pesa ${peso === formatBytes(MAX_ANEXO_BYTES) ? `un poco más de ${peso}` : peso} y supera el máximo de 10 MB.`,
    }
  }

  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  } catch {
    return { ok: false, error: 'No se pudo leer el archivo. Comprueba que no esté abierto o bloqueado e inténtalo de nuevo.' }
  }
  if (!formato.firmaValida(bytes)) {
    return {
      ok: false,
      error: `El contenido no corresponde a un ${formato.etiqueta}. Es posible que la extensión se haya cambiado o que el archivo esté dañado.`,
    }
  }

  return { ok: true, formato: formato.etiqueta, mime: file.type || 'no informado por el sistema' }
}

/** Documentos Anexos: PDF, DOC o DOCX de hasta 10 MB. */
export function validarArchivoAnexo(file: File): Promise<ValidacionArchivo> {
  return validarArchivo(file, REGLAS_ANEXOS)
}

/** Firma del perfil: PDF, PNG o JPG/JPEG de hasta 10 MB. */
export function validarArchivoFirma(file: File): Promise<ValidacionArchivo> {
  return validarArchivo(file, REGLAS_FIRMA)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('es-CO', { maximumFractionDigits: 0 })} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`
}
