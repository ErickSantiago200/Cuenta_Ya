import { createContext, useContext } from 'react'

/** Datos mínimos del usuario autenticado que usa la interfaz. */
export interface SessionUser {
  uid: string
  nombre: string
  email: string
}

export interface AuthContextValue {
  user: SessionUser | null
  /** `true` mientras Firebase restaura la sesión al cargar la app. */
  loading: boolean
  /** `false` si faltan las variables de entorno de Firebase. */
  configured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (nombre: string, email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return context
}
