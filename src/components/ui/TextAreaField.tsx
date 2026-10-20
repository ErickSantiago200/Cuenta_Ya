import { useId, type TextareaHTMLAttributes } from 'react'
import { Field } from './Field'
import { fieldInputClass, fieldMessageId } from './styles'

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, error, hint, required, rows = 3, ...props }: TextAreaFieldProps) {
  const id = useId()
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldMessageId(id, error, hint)}
        className={`${fieldInputClass(error)} resize-y px-3`}
        {...props}
      />
    </Field>
  )
}
