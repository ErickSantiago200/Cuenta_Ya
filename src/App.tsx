import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
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
import { Register } from './pages/Register'
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards'

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
            {/* Los borradores de informes viven en memoria mientras dure la sesión en el área privada. */}
            <Route
              element={
                <InformesProvider>
                  <AppLayout />
                </InformesProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="informes" element={<InformesList />} />
              <Route path="informes/nuevo" element={<InformeNuevo />} />
              <Route path="informes/:id" element={<InformeDetalle />} />
              <Route path="informes/:id/editar" element={<InformeEditar />} />
              <Route path="documentos-anexos" element={<DocumentosAnexos />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
