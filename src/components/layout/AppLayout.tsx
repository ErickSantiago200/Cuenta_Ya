import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'

/** Estructura de las pantallas internas: menú lateral + contenido de la ruta activa. */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Barra superior solo en pantallas pequeñas */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-primary px-4 py-3 shadow-card lg:hidden">
        <Logo tone="dark" />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-white/10"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
