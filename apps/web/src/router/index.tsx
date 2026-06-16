/**
 * @file router/index.tsx
 * @description Configuration des routes React Router v6.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'


/**
 * @param allowedRoles - si défini, seuls ces rôles peuvent accéder
 */
export function ProtectedRoute({
  allowedRoles
}: {
  allowedRoles?: string[]
}) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  // Non connecté → redirection vers login
  // state={{ from: location }} → mémorise la page demandée
  // pour rediriger après le login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Rôle non autorisé → redirection vers page par défaut
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const defaultRoute = user.role === 'BRIGADE' ? '/fiches' : '/dashboard'
    return <Navigate to={defaultRoute} replace />
  }

  // Connecté et autorisé → affiche la page demandée
  return <Outlet />
}

/**
 * PublicRoute — accessible seulement si NON connecté.
 * Si déjà connecté → redirection vers la page principale.
 */
export function PublicRoute() {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    // Redirige selon le rôle
    const defaultRoute = user.role === 'BRIGADE' ? '/fiches' : '/dashboard'
    return <Navigate to={defaultRoute} replace />
  }

  return <Outlet />
}