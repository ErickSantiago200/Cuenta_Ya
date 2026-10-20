import { LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { itemsMenu } from '../../data/mockData'
import { Logo } from './Logo'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const itemBase = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()

  // Al cerrar sesión, ProtectedRoute redirige a /login.
  function handleSignOut() {
    signOut().catch(() => window.alert('No se pudo cerrar sesión. Inténtalo de nuevo.'))
  }

  return (
    <>
      {/* Capa oscura detrás del menú en pantallas pequeñas */}
      <div
        className={`fixed inset-0 z-30 bg-primary/50 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary text-white shadow-raised transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Logo tone="dark" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
          <ul className="space-y-1">
            {itemsMenu.map(({ id, etiqueta, icono: Icono, ruta }) => (
              <li key={id}>
                {ruta ? (
                  <NavLink
                    to={ruta}
                    end={ruta === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${itemBase} relative ${
                        isActive
                          ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-accent'
                          : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icono className={`h-5 w-5 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                        {etiqueta}
                      </>
                    )}
                  </NavLink>
                ) : (
                  // Módulos aún no implementados: visibles, pero sin navegación.
                  <span aria-disabled="true" className={`${itemBase} cursor-default text-white/75`}>
                    <Icono className="h-5 w-5 shrink-0" />
                    {etiqueta}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          {user && (
            <div className="mb-3 px-3">
              <p className="truncate text-sm font-semibold text-white">{user.nombre}</p>
              <p className="truncate text-xs text-white/75">{user.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className={`${itemBase} w-full text-white/75 hover:bg-white/10 hover:text-white`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
