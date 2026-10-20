import { FirebaseError } from 'firebase/app'

export const STORAGE_NOT_CONFIGURED = 'app/storage-not-configured'

const NO_HABILITADO =
  'El almacenamiento de documentos no está disponible. Verifica que Firebase Storage esté habilitado en el proyecto.'

const mensajes: Record<string, string> = {
  [STORAGE_NOT_CONFIGURED]: NO_HABILITADO,
  'storage/bucket-not-found': NO_HABILITADO,
  'storage/project-not-found': NO_HABILITADO,
  'storage/no-default-bucket': NO_HABILITADO,
  'storage/unauthorized': 'No tienes permiso para realizar esta acción sobre el documento.',
  'storage/unauthenticated': 'Tu sesión expiró. Vuelve a iniciar sesión.',
  'storage/retry-limit-exceeded': 'La conexión es inestable y no se pudo completar la operación. Inténtalo de nuevo.',
  'storage/quota-exceeded': 'Se superó la cuota de almacenamiento del proyecto. Contacta al administrador.',
  'storage/invalid-checksum': 'El archivo se dañó durante la carga. Inténtalo de nuevo.',
  'storage/server-file-wrong-size': 'El archivo se dañó durante la carga. Inténtalo de nuevo.',
}

export function getStorageErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return mensajes[error.code] ?? `No se pudo completar la operación (${error.code}).`
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

export function isStorageError(error: unknown, code: string): boolean {
  return error instanceof FirebaseError && error.code === code
}
