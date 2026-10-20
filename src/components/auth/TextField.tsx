import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes } from 'react'
import { Field } from '../ui/Field'
import { fieldInputClass, fieldMessageId } from '../ui/styles'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  icon?: LucideIcon
  error?: string
  hint?: string
}

/** Campo de formulario con icono opcional, mensaje de error o ayuda y, si es contraseña, botón para mostrarla. */
export function TextField({ label, icon: Icono, error, hint, required, type = 'text', ...inputProps }: TextFieldProps) {
  const id = useId()
  const isPassword = type === 'password'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {Icono && (
          <Icono
            className={`pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
              error ? 'text-danger' : 'text-ink-muted'
            }`}
          />
        )}
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldMessageId(id, error, hint)}
          className={`${fieldInputClass(error)} ${Icono ? 'pl-10' : 'pl-3'} ${isPassword ? 'pr-11' : 'pr-3'}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Field>
  )
}
