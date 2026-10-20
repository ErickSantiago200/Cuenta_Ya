import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { Field } from './Field'
import { fieldInputClass, fieldMessageId } from './styles'

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export function SelectField({ label, error, hint, required, children, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        <select
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldMessageId(id, error, hint)}
          className={`${fieldInputClass(error)} appearance-none pl-3 pr-10`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
}
