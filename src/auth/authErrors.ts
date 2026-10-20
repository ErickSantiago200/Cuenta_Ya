import { FirebaseError } from 'firebase/app'

export const AUTH_NOT_CONFIGURED = 'app/auth-not-configured'

const mensajes: Record<string, string> = {
  [AUTH_NOT_CONFIGURED]:
    'La autenticación aún no está configurada. Falta conectar el proyecto de Firebase.',
  'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
  'auth/wrong-password': 'El correo o la contraseña no son correctos.',
  'auth/user-not-found': 'El correo o la contraseña no son correctos.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al administrador.',
  'auth/email-already-in-use': 'Ya existe una cuenta registrada con este correo.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el inicio de sesión.',
  'auth/cancelled-popup-request': 'Se canceló la ventana de Google. Inténtalo de nuevo.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes.',
  'auth/account-exists-with-different-credential':
    'Este correo ya está registrado con otro método de acceso.',
  'auth/operation-not-allowed':
    'Este método de acceso no está habilitado en Firebase. Actívalo en la consola.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado en Firebase para iniciar sesión con Google.',
  'auth/invalid-api-key': 'La clave de Firebase no es válida. Revisa el archivo .env.local.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    'La clave de Firebase no es válida. Revisa el archivo .env.local.',
}

/** Traduce un error de autenticación a un mensaje comprensible en español. */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return mensajes[error.code] ?? `No se pudo completar la operación (${error.code}).`
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

/** Indica si el usuario cerró la ventana de Google a propósito (no se muestra como error). */
export function isPopupDismissed(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')
  )
}
