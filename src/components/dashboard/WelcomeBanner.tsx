import { Sparkles } from 'lucide-react'

interface WelcomeBannerProps {
  nombre: string
  contrato: string
}

export function WelcomeBanner({ nombre, contrato }: WelcomeBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary to-action p-6 text-white shadow-raised sm:p-8">
      {/* Detalles decorativos */}
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
      <div className="absolute -right-4 -top-8 h-32 w-32 rounded-full border border-accent/40" aria-hidden="true" />
      <Sparkles className="absolute right-6 top-6 h-8 w-8 text-accent" aria-hidden="true" />

      <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">
        {contrato}
      </span>
      <h2 className="mt-3 text-2xl font-bold sm:text-3xl">¡Bienvenido(a), {nombre}!</h2>
      <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
        Gestiona tus cuentas de cobro, informes y documentos desde un solo lugar.
      </p>
    </section>
  )
}
