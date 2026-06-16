/**
 * @file App.tsx
 * @description Point d'entrée de l'application React.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute, PublicRoute } from './router'
import { useAuth } from './hooks/useAuth'

import { LoginPage }       from './pages/Auth/LoginPage'
import { FichesPage }      from './pages/Brigade/FichesPage'
import { FicheDetailPage } from './pages/Brigade/FicheDetailPage'
import { CPPage }          from './pages/Brigade/CPPage'
import { DashboardPage }   from './pages/IGT/DashboardPage'
import { RapportsPage }    from './pages/IGT/RapportsPage'
import { BrigadesPage }    from './pages/Admin/BrigadesPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

function AppRoutes() {
  const { user, isAuthenticated, isHydrated } = useAuth()

  // Attend que Zustand ait lu localStorage avant toute décision de routing.
  // Sans ça : isAuthenticated = false au premier render → redirect /login
  // → Zustand finit de lire → isAuthenticated = true → redirect /dashboard
  // → boucle infinie.
  if (!isHydrated) return null

  return (
    <Routes>
      {/* ── ROUTE RACINE ─────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          isAuthenticated && user
            ? <Navigate to={user.role === 'BRIGADE' ? '/fiches' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* ── ROUTES PUBLIQUES ─────────────────────────────────────── */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ── ROUTES BRIGADE ───────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['BRIGADE', 'IGT', 'ADMIN']} />}>
        <Route path="/fiches" element={<FichesPage />} />
        <Route path="/fiches/:id" element={<FicheDetailPage />} />
        <Route path="/cp" element={<CPPage />} />
      </Route>

      {/* ── ROUTES IGT / ADMIN ───────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['IGT', 'ADMIN']} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rapports" element={<RapportsPage />} />
      </Route>

      {/* ── ROUTES ADMIN UNIQUEMENT ──────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/brigades" element={<BrigadesPage />} />
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px'
          },
          success: {
            style: { background: '#00897B', color: 'white' }
          },
          error: {
            style: { background: '#DC2626', color: 'white' }
          }
        }}
      />
    </QueryClientProvider>
  )
}