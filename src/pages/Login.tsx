import { Lock, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getAuthErrorMessage, isPopupDismissed } from '../auth/authErrors'
import { AuthCard } from '../components/auth/AuthCard'
import { Divider } from '../components/auth/Divider'
import { FormAlert } from '../components/auth/FormAlert'
import { GoogleButton } from '../components/auth/GoogleButton'
import { NotConfiguredNotice } from '../components/auth/NotConfiguredNotice'
import { SubmitButton } from '../components/auth/SubmitButton'
import { TextField } from '../components/auth/TextField'
import { useFormValidation } from '../hooks/useFormValidation'
import { validateEmail, validateRequiredPassword } from '../utils/validation'

export function Login() {
  const { signIn, signInWithGoogle, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<'email' | 'google' | null>(null)

  const { errorFor, touch, validateAll } = useFormValidation({
    email: validateEmail(email),
    password: validateRequiredPassword(password),
  })

  // Tras un acceso correcto, PublicOnlyRoute redirige automáticamente al panel.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (!validateAll()) return
    setPending('email')
    try {
      await signIn(email.trim(), password)
    } catch (error) {
      setFormError(getAuthErrorMessage(error))
      setPending(null)
    }
  }

  async function handleGoogle() {
    setFormError(null)
    setPending('google')
    try {
      await signInWithGoogle()
    } catch (error) {
      if (!isPopupDismissed(error)) setFormError(getAuthErrorMessage(error))
      setPending(null)
    }
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Gestiona tus cuentas de cobro de forma rápida y ordenada."
      footer={
        <>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="font-semibold text-action hover:text-action-hover hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <NotConfiguredNotice />
        {formError && <FormAlert variant="error">{formError}</FormAlert>}

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
        <div>
          <TextField
            label="Contraseña"
            icon={Lock}
            type="password"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={touch('password')}
            error={errorFor('password')}
          />
          <div className="mt-2 text-right">
            <Link to="/recuperar" className="text-sm font-medium text-action hover:text-action-hover hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <SubmitButton loading={pending === 'email'} disabled={!configured || pending !== null}>
          Iniciar sesión
        </SubmitButton>
      </form>

      <Divider label="o" />
      <GoogleButton
        label="Continuar con Google"
        onClick={handleGoogle}
        disabled={!configured || pending !== null}
      />
    </AuthCard>
  )
}
