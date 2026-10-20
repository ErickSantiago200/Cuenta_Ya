import { useAuth } from '../auth/AuthContext'
import { ReportsTable } from '../components/dashboard/ReportsTable'
import { StatCard } from '../components/dashboard/StatCard'
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner'
import { contratoEjemplo, indicadores, resumenInformesDemo } from '../data/mockData'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Panel Principal</h1>
        <p className="mt-1 text-sm text-ink">
          Los indicadores y el resumen de informes muestran datos de demostración.
        </p>
      </div>

      <WelcomeBanner nombre={user?.nombre ?? ''} contrato={contratoEjemplo} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicadores.map((indicador) => (
          <StatCard key={indicador.id} {...indicador} />
        ))}
      </div>

      <ReportsTable informes={resumenInformesDemo} />
    </div>
  )
}
