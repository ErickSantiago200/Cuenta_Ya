import { ArrowLeft, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getAuthErrorMessage } from '../auth/authErrors'
import { AuthCard } from '../components/auth/AuthCard'
import { FormAlert } from '../components/auth/FormAlert'
import { NotConfiguredNotice } from '../components/auth/NotConfiguredNotice'
import { SubmitButton } from '../components/auth/SubmitButton'
import { TextField } from '../components/auth/TextField'
import { useFormValidation } from '../hooks/useFormValidation'
import { validateEmail } from '../utils/validation'

export function ForgotPassword() {
  const { resetPassword, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  const { errorFor, touch, validateAll } = useFormValidation({ email: validateEmail(email) })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSent(false)
    if (!validateAll()) return
    setPending(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva contraseña."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-action hover:text-action-hover hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <NotConfiguredNotice />
        {formError && <FormAlert variant="error">{formError}</FormAlert>}
        {sent && (
          <FormAlert variant="success">
            Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
            Revisa también la carpeta de correo no deseado.
          </FormAlert>
        )}

        <TextField
          label="Correo electrónico"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={touch('email')}
          error={errorFor('email')}
        />

        <SubmitButton loading={pending} disabled={!configured}>
          Enviar enlace
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
