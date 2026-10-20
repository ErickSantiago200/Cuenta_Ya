import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { BrandBackground } from '../components/layout/BrandBackground'

interface RedirectState {
  from?: string
}

function FullScreenLoader() {
  return (
    <div className="relative isolate flex min-h-full items-center justify-center">
      <BrandBackground />
      <Loader2 className="h-10 w-10 animate-spin text-action" aria-label="Cargando" />
    </div>
  )
}

/** Solo deja pasar a usuarios autenticados; al resto los envía a /login recordando a dónde iban. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!user) {
    const state: RedirectState = { from: location.pathname }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}

/** Pantallas de acceso: si ya hay sesión, redirige al destino original o al panel. */
export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (user) {
    const from = (location.state as RedirectState | null)?.from ?? '/'
    return <Navigate to={from} replace />
  }
  return <Outlet />
}
