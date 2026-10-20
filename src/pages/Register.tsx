import { Lock, Mail, User } from 'lucide-react'
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
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validateFullName,
  validateNewPassword,
  validatePasswordConfirmation,
} from '../utils/validation'

export function Register() {
  const { signUp, signInWithGoogle, configured } = useAuth()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<'email' | 'google' | null>(null)

  const { errorFor, touch, validateAll } = useFormValidation({
    nombre: validateFullName(nombre),
    email: validateEmail(email),
    password: validateNewPassword(password),
    confirmation: validatePasswordConfirmation(password, confirmation),
  })

  // Tras crear la cuenta, PublicOnlyRoute redirige automáticamente al panel.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (!validateAll()) return
    setPending('email')
    try {
      await signUp(nombre.trim(), email.trim(), password)
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
      title="Crear cuenta"
      subtitle="Regístrate para empezar a gestionar tus cuentas de cobro."
      footer={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-semibold text-action hover:text-action-hover hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <NotConfiguredNotice />
        {formError && <FormAlert variant="error">{formError}</FormAlert>}

        <TextField
          label="Nombre completo"
          icon={User}
          autoComplete="name"
          placeholder="Tu nombre y apellidos"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={touch('nombre')}
          error={errorFor('nombre')}
        />
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
        <TextField
          label="Contraseña"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={touch('password')}
          error={errorFor('password')}
        />
        <TextField
          label="Confirmar contraseña"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder="Repite la contraseña"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          onBlur={touch('confirmation')}
          error={errorFor('confirmation')}
        />

        <SubmitButton loading={pending === 'email'} disabled={!configured || pending !== null}>
          Crear cuenta
        </SubmitButton>
      </form>

      <Divider label="o" />
      <GoogleButton
        label="Registrarse con Google"
        onClick={handleGoogle}
        disabled={!configured || pending !== null}
      />
    </AuthCard>
  )
}
