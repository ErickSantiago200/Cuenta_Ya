import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface SubmitButtonProps {
  loading: boolean
  disabled?: boolean
  children: ReactNode
}

export function SubmitButton({ loading, disabled, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
