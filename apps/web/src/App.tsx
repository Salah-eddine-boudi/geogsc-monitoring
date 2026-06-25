/**
 * @file App.tsx — Version complète avec toutes les routes
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute, PublicRoute } from './router'
import { useAuth } from './hooks/useAuth'

// Auth
import { LoginPage }        from './pages/Auth/LoginPage'
// Brigade / Partagées
import { FichesPage }       from './pages/Brigade/FichesPage'
import { FicheDetailPage }  from './pages/Brigade/FicheDetailPage'
import { CPPage }           from './pages/Brigade/CPPage'
// IGT
import { DashboardPage }    from './pages/IGT/DashboardPage'
import { RapportsPage }     from './pages/IGT/RapportsPage'
// Admin
import { BrigadesPage }     from './pages/Admin/BrigadesPage'
// Nouvelles pages
import { RecapPage }        from './pages/IGT/RecapPage'
import { RHPage }           from './pages/Admin/RHPage'
import { MaterielPage }     from './pages/Admin/MaterielPage'
import { CaissePage }       from './pages/Admin/CaissePage'
import { VehiculesPage }    from './pages/Admin/VehiculesPage'
import { DemandesPage }     from './pages/Brigade/DemandesPage'
import { MessageriePage }   from './pages/Shared/MessageriePage'
import { GaleriePage }      from './pages/Shared/GaleriePage'
import { GenerateurPage }   from './pages/IGT/GenerateurPage'
import { PlanPage }         from './pages/Shared/PlanPage'
import { ProfilPage }       from './pages/Shared/ProfilPage'   // ← AJOUT

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false }
  }
})

function AppRoutes() {
  const { user, isAuthenticated, isHydrated } = useAuth()
  if (!isHydrated) return null

  return (
    <Routes>
      {/* Racine */}
      <Route path="/" element={
        isAuthenticated && user
          ? <Navigate to={user.role === 'BRIGADE' ? '/fiches' : '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />

      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Tous rôles authentifiés */}
      <Route element={<ProtectedRoute allowedRoles={['BRIGADE', 'IGT', 'ADMIN']} />}>
        <Route path="/fiches"      element={<FichesPage />} />
        <Route path="/fiches/:id"  element={<FicheDetailPage />} />
        <Route path="/cp"          element={<CPPage />} />
        <Route path="/messagerie"  element={<MessageriePage />} />
        <Route path="/galerie"     element={<GaleriePage />} />
        <Route path="/profil"      element={<ProfilPage />} />   {/* ← AJOUT */}
      </Route>

      {/* IGT + Admin */}
      <Route element={<ProtectedRoute allowedRoles={['IGT', 'ADMIN']} />}>
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/rapports"   element={<RapportsPage />} />
        <Route path="/recap"      element={<RecapPage />} />
        <Route path="/plan"       element={<PlanPage />} />
        <Route path="/rh"         element={<RHPage />} />
        <Route path="/materiel"   element={<MaterielPage />} />
        <Route path="/caisse"     element={<CaissePage />} />
        <Route path="/vehicules"  element={<VehiculesPage />} />
        <Route path="/demandes"   element={<DemandesPage />} />
        <Route path="/evenements" element={<CPPage />} />
        <Route path="/generateur" element={<GenerateurPage />} />
      </Route>

      {/* Admin uniquement */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/brigades" element={<BrigadesPage />} />
      </Route>

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
      <Toaster position="bottom-center" toastOptions={{
        duration: 3000,
        style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        success: { style: { background: '#00897B', color: 'white' } },
        error:   { style: { background: '#DC2626', color: 'white' } }
      }} />
    </QueryClientProvider>
  )
}