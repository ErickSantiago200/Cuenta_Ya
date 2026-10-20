import { useAuth } from '../../auth/AuthContext'
import { FormAlert } from './FormAlert'

/** Aviso visible mientras no existan las variables de entorno de Firebase. */
export function NotConfiguredNotice() {
  const { configured } = useAuth()
  if (configured) return null
  return (
    <FormAlert variant="info">
      La autenticación aún no está configurada. Crea el archivo <code>.env.local</code> a partir de{' '}
      <code>.env.example</code> con los datos de tu proyecto de Firebase.
    </FormAlert>
  )
}
