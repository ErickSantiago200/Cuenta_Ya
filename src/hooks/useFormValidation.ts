import { useState } from 'react'

/**
 * Muestra el error de cada campo solo después de que el usuario lo abandona
 * o intenta enviar el formulario, para no marcar errores mientras escribe por primera vez.
 */
export function useFormValidation<K extends string>(errors: Record<K, string | undefined>) {
  const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  return {
    errorFor: (field: K) => (touched[field] || submitted ? errors[field] : undefined),
    touch: (field: K) => () => setTouched((prev) => ({ ...prev, [field]: true })),
    /** Marca el formulario como enviado y devuelve si todos los campos son válidos. */
    validateAll: () => {
      setSubmitted(true)
      return Object.values<string | undefined>(errors).every((error) => !error)
    },
  }
}
