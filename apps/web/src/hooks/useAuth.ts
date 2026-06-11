import { useAuthStore } from '../stores/auth.store'

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()

  const isIGT = user?.role === 'IGT'
  const isAdmin = user?.role === 'ADMIN'
  const isBrigade = user?.role === 'BRIGADE'
  const isIGTOrAdmin = isIGT || isAdmin

  return {
    user,
    token,
    isAuthenticated,
    isIGT,
    isAdmin,
    isBrigade,
    isIGTOrAdmin,
    login,
    logout
  }
}