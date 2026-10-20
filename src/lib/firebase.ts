import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// La configuración se lee de variables de entorno (.env.local). Nunca se escribe en el código.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = isFirebaseConfigured ? initializeApp({ ...firebaseConfig, storageBucket }) : null

/** Instancia de Firebase Auth, o `null` si faltan las variables de entorno. */
export const auth: Auth | null = app ? getAuth(app) : null

if (auth) {
  // Correos de Firebase (p. ej. restablecer contraseña) en español.
  auth.languageCode = 'es'
}

/** `false` si falta VITE_FIREBASE_STORAGE_BUCKET. No garantiza que el bucket exista en Firebase. */
export const isStorageConfigured = Boolean(app && storageBucket)

/** Instancia de Firebase Storage, o `null` si no está configurado. */
export const storage: FirebaseStorage | null = app && storageBucket ? getStorage(app) : null
