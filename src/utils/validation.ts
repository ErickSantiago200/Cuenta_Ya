export const MIN_PASSWORD_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Ingresa tu correo electrónico.'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Ingresa un correo válido, por ejemplo nombre@correo.com.'
}

export function validateRequiredPassword(password: string): string | undefined {
  if (!password) return 'Ingresa tu contraseña.'
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Crea una contraseña.'
  if (password.length < MIN_PASSWORD_LENGTH)
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return 'Confirma tu contraseña.'
  if (password !== confirmation) return 'Las contraseñas no coinciden.'
}

export function validateFullName(nombre: string): string | undefined {
  if (!nombre.trim()) return 'Ingresa tu nombre completo.'
  if (nombre.trim().length < 3) return 'El nombre es demasiado corto.'
}
