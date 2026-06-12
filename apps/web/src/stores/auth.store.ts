/**
 * @file auth.store.ts
 * @description Store Zustand — état global d'authentification.
 *
 * CORRECTION : ajout de isHydrated pour éviter la boucle de redirection.
 * Zustand persist est asynchrone — au premier render, isAuthenticated = false
 * même si le token est dans localStorage. isHydrated = true signale que
 * localStorage a été lu et que l'état est fiable.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/api.types'
import { authService } from '../services/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isHydrated: boolean        // true une fois localStorage lu par Zustand

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
      isHydrated: false,     // false au départ — devient true après réhydration

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

      // isHydrated n'est PAS persisté — doit toujours démarrer à false
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),

      // Appelé par Zustand quand il finit de lire localStorage
      // → on passe isHydrated à true → les routes peuvent maintenant décider
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      }
    }
  )
)