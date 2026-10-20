import type { ReactNode } from 'react'
import { BrandBackground } from '../layout/BrandBackground'
import { Logo } from '../layout/Logo'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Estructura común de las pantallas de acceso: fondo de marca + tarjeta blanca centrada. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative isolate flex min-h-full items-center justify-center px-4 py-10">
      <BrandBackground />

      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-raised sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size="lg" />
            <h1 className="mt-5 text-xl font-bold text-primary">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          </div>
          {children}
          {footer && (
            <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
