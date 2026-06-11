/**
 * @file auth.store.ts
 * @description Store Zustand — état global d'authentification.
 *
 * Persiste dans localStorage :
 * - token JWT
 * - user (nom, rôle, brigadeId)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/api.types'
import { authService } from '../services/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await authService.login(email, password)
        localStorage.setItem('token', response.token)
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true
        })
      },

      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)