import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { useAuth } from './auth/AuthContext'
import { AuthProvider } from './auth/AuthProvider'
import { CuentaCobroProvider } from './cuenta/CuentaCobroProvider'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { DocumentosAnexos } from './pages/DocumentosAnexos'
import { InformesProvider } from './informes/InformesProvider'
import { ForgotPassword } from './pages/ForgotPassword'
import { InformeDetalle } from './pages/informes/InformeDetalle'
import { InformeEditar } from './pages/informes/InformeEditar'
import { InformeNuevo } from './pages/informes/InformeNuevo'
import { InformesList } from './pages/informes/InformesList'
import { Login } from './pages/Login'
import { MiPerfil } from './pages/MiPerfil'
import { PerfilProvider } from './perfil/PerfilProvider'
import { Register } from './pages/Register'
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards'

/**
 * Datos temporales del área privada (perfil, informes y cuenta de cobro), solo en memoria.
 * `key={uid}` reinicia todo el estado si cambia el usuario, para que nunca se mezclen datos entre cuentas.
 */
function SesionPrivada() {
  const { user } = useAuth()
  return (
    <PerfilProvider key={user?.uid}>
      <InformesProvider>
        <CuentaCobroProvider>
          <AppLayout />
        </CuentaCobroProvider>
      </InformesProvider>
    </PerfilProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar" element={<ForgotPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<SesionPrivada />}>
              <Route index element={<Dashboard />} />
              <Route path="informes" element={<InformesList />} />
              <Route path="informes/nuevo" element={<InformeNuevo />} />
              <Route path="informes/:id" element={<InformeDetalle />} />
              <Route path="informes/:id/editar" element={<InformeEditar />} />
              <Route path="documentos-anexos" element={<DocumentosAnexos />} />
              {/* El acta se completa en su tarjeta; la ruta antigua del formulario duplicado redirige allí. */}
              <Route path="documentos-anexos/acta-ejecucion" element={<Navigate to="/documentos-anexos#acta-ejecucion" replace />} />
              <Route path="mi-perfil" element={<MiPerfil />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
