/**
 * @file App.tsx
 * @description Point d'entrée de l'application React.
 *
 * RESPONSABILITÉS :
 * → Configure React Query (cache serveur)
 * → Configure React Router (navigation)
 * → Configure les toasts (notifications)
 * → Définit toutes les routes de l'application
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute, PublicRoute } from './router'
import { useAuth } from './hooks/useAuth'

// ── IMPORT DES PAGES ──────────────────────────────────────────────
// Les pages n'existent pas encore — on les créera après
// Pour l'instant on met des placeholders
import { LoginPage } from './pages/Auth/LoginPage'
import { FichesPage } from './pages/Brigade/FichesPage'
import { FicheDetailPage } from './pages/Brigade/FicheDetailPage'
import { DashboardPage } from './pages/IGT/DashboardPage'
import { RapportsPage } from './pages/IGT/RapportsPage'
import { BrigadesPage } from './pages/Admin/BrigadesPage'

/**
 * QueryClient — configuration du cache React Query.
 *
 * staleTime → durée pendant laquelle les données sont considérées
 * fraîches. Pendant ce temps, pas de re-fetch automatique.
 * 5 minutes = bon équilibre entre fraîcheur et performance.
 *
 * retry → nombre de tentatives si une requête échoue.
 * 1 = essaie une fois de plus avant d'afficher l'erreur.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false // ne re-fetch pas au focus de l'onglet
    }
  }
})

/**
 * AppRoutes — composant séparé pour accéder au contexte auth
 * après le rendu des providers.
 */
function AppRoutes() {
  const { user, isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* ── ROUTE RACINE ── redirige selon l'état ────────────────── */}
      <Route
        path="/"
        element={
          isAuthenticated && user
            ? <Navigate to={user.role === 'BRIGADE' ? '/fiches' : '/dashboard'} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* ── ROUTES PUBLIQUES ── non accessibles si connecté ─────── */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* ── ROUTES BRIGADE ───────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['BRIGADE', 'IGT', 'ADMIN']} />}>
        <Route path="/fiches" element={<FichesPage />} />
        <Route path="/fiches/:id" element={<FicheDetailPage />} />
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

      {/* ── 404 ── redirige vers la racine ───────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    /**
     * QueryClientProvider → fournit le cache React Query
     * à tous les composants enfants.
     * Doit envelopper toute l'application.
     */
    <QueryClientProvider client={queryClient}>

      {/**
       * BrowserRouter → active la navigation React Router.
       * Utilise l'API History du navigateur (pas de #hash dans l'URL).
       */}
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>

      {/**
       * Toaster → affiche les notifications toast.
       * Position bottom-center = visible sans cacher le contenu.
       * Parfait pour les messages de succès/erreur des actions.
       */}
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
            style: {
              background: '#00897B',
              color: 'white'
            }
          },
          error: {
            style: {
              background: '#DC2626',
              color: 'white'
            }
          }
        }}
      />
    </QueryClientProvider>
  )
}