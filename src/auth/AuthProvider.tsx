import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { AuthContext, type AuthContextValue, type SessionUser } from './AuthContext'
import { AUTH_NOT_CONFIGURED } from './authErrors'

function toSessionUser(user: User, nombre?: string): SessionUser {
  const email = user.email ?? ''
  return {
    uid: user.uid,
    nombre: nombre ?? user.displayName ?? email.split('@')[0],
    email,
  }
}

function requireAuth(): Auth {
  if (!auth) {
    throw new FirebaseError(AUTH_NOT_CONFIGURED, 'Firebase no está configurado')
  }
  return auth
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? toSessionUser(firebaseUser) : null)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      async signIn(email, password) {
        await signInWithEmailAndPassword(requireAuth(), email, password)
      },
      async signUp(nombre, email, password) {
        const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
        await updateProfile(credential.user, { displayName: nombre })
        // onAuthStateChanged se dispara antes de guardar el nombre; lo actualizamos aquí.
        setUser(toSessionUser(credential.user, nombre))
      },
      async signInWithGoogle() {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        await signInWithPopup(requireAuth(), provider)
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(requireAuth(), email)
      },
      async signOut() {
        await firebaseSignOut(requireAuth())
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
