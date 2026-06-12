/**
 * @file router.tsx
 * @description Guards de navigation — ProtectedRoute et PublicRoute.
 *
 * PROBLÈME RÉSOLU :
 * Zustand persist lit localStorage de façon asynchrone.
 * Sans isHydrated, au premier render isAuthenticated = false
 * → ProtectedRoute redirige vers /login
 * → PublicRoute voit isAuthenticated = false → affiche login
 * → Zustand finit de lire → isAuthenticated = true → redirige /dashboard
 * → boucle infinie de redirections.
 *
 * SOLUTION :
 * On attend isHydrated = true avant toute décision de redirection.
 * Pendant la réhydration → null (écran blanc ~50ms, imperceptible).
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import type { Role } from './types/api.types'

// ─── ROUTE PROTÉGÉE ───────────────────────────────────────────────

/**
 * ProtectedRoute — bloque l'accès si non connecté ou mauvais rôle.
 *
 * USAGE dans App.tsx :
 * <Route element={<ProtectedRoute allowedRoles={['IGT', 'ADMIN']} />}>
 *   <Route path="/dashboard" element={<DashboardPage />} />
 * </Route>
 *
 * COMPORTEMENT :
 * 1. isHydrated = false → null (attend localStorage)
 * 2. isAuthenticated = false → /login
 * 3. rôle non autorisé → / (redirection racine)
 * 4. OK → affiche la page enfant via <Outlet />
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { isAuthenticated, isHydrated, user } = useAuthStore()

  // Attend que Zustand ait fini de lire localStorage
  // Sans ça → redirection prématurée vers /login à chaque refresh
  if (!isHydrated) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Rôle non autorisé → retour à la racine (qui redirige selon le rôle)
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

// ─── ROUTE PUBLIQUE ───────────────────────────────────────────────

/**
 * PublicRoute — redirige vers l'app si déjà connecté.
 *
 * USAGE dans App.tsx :
 * <Route element={<PublicRoute />}>
 *   <Route path="/login" element={<LoginPage />} />
 * </Route>
 *
 * COMPORTEMENT :
 * 1. isHydrated = false → null (attend localStorage)
 * 2. isAuthenticated = true → redirige selon le rôle
 * 3. non connecté → affiche la page publique (login)
 */
export function PublicRoute() {
  const { isAuthenticated, isHydrated, user } = useAuthStore()

  // Même garde — sans ça, l'utilisateur connecté voit /login
  // une fraction de seconde avant d'être redirigé
  if (!isHydrated) return null

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'BRIGADE' ? '/fiches' : '/dashboard'} replace />
  }

  return <Outlet />
}