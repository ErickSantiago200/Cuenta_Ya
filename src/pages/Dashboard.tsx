import { CalendarCheck, CalendarRange, Send, Wallet } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ContractSummary } from '../components/dashboard/ContractSummary'
import { ReportsTable } from '../components/dashboard/ReportsTable'
import { StatCard } from '../components/dashboard/StatCard'
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner'
import { resumenInformesDemo } from '../data/mockData'
import { useInformes } from '../informes/InformesContext'
import { usePerfil } from '../perfil/PerfilContext'
import type { Indicador } from '../types'
import { formatearFecha } from '../utils/informes'
import { calcularDuracion, describirDuracion, formatearCOP } from '../utils/perfil'

export function Dashboard() {
  const { user } = useAuth()
  const { perfil } = usePerfil()
  const { informes } = useInformes()

  const duracion = calcularDuracion(perfil.fechaInicio, perfil.fechaTerminacion)
  const propios = informes.filter((i) => !i.esDemo)
  // El envío aún no existe: los informes "enviados" solo pueden ser los que salieron de Borrador.
  const enviados = propios.filter((i) => i.estado !== 'Borrador').length
  const borradores = propios.length - enviados

  const indicadores: Indicador[] = [
    perfil.valorContrato
      ? { id: 'valor', titulo: 'Valor del contrato', valor: formatearCOP(perfil.valorContrato), detalle: 'Registrado en Mi perfil', icono: Wallet }
      : { id: 'valor', titulo: 'Valor del contrato', valor: 'Pendiente', detalle: 'Regístralo en Mi perfil', icono: Wallet, pendiente: true },
    perfil.fechaInicio && perfil.fechaTerminacion
      ? {
          id: 'vigencia',
          titulo: perfil.vigencia ? `Vigencia ${perfil.vigencia}` : 'Vigencia del contrato',
          valor: duracion ? describirDuracion(duracion) : '—',
          detalle: `${formatearFecha(perfil.fechaInicio)} – ${formatearFecha(perfil.fechaTerminacion)}`,
          icono: CalendarRange,
        }
      : {
          id: 'vigencia',
          titulo: perfil.vigencia ? `Vigencia ${perfil.vigencia}` : 'Vigencia del contrato',
          valor: 'Pendiente',
          detalle: 'Registra las fechas en Mi perfil',
          icono: CalendarRange,
          pendiente: true,
        },
    {
      id: 'pagos',
      titulo: 'Pagos planeados',
      valor: 'Pendiente',
      detalle: 'Requiere la forma de pago del contrato',
      icono: CalendarCheck,
      pendiente: true,
    },
    {
      id: 'enviados',
      titulo: 'Informes enviados',
      valor: String(enviados),
      detalle: `${borradores} ${borradores === 1 ? 'borrador' : 'borradores'} en esta sesión`,
      icono: Send,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Panel Principal</h1>
        <p className="mt-1 text-sm text-ink">
          La información contractual proviene de Mi perfil. El resumen de informes muestra datos de demostración.
        </p>
      </div>

      <WelcomeBanner
        nombre={user?.nombre ?? ''}
        contrato={perfil.numeroContrato ? `Contrato N.º ${perfil.numeroContrato}` : 'Contrato pendiente por registrar'}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((indicador) => (
          <StatCard key={indicador.id} {...indicador} />
        ))}
      </div>

      <ContractSummary perfil={perfil} />

      <ReportsTable informes={resumenInformesDemo} />
    </div>
  )
}
