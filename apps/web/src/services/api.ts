/**
 * @file api.ts
 * @description Instance Axios centrale avec interceptors JWT.
 *
 * INTERCEPTORS :
 * Request  → ajoute automatiquement le token JWT dans chaque requête
 * Response → redirige vers /login si 401 (token expiré)
 */

import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor request — injecte le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor response — gère le 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Nettoie le store Zustand complètement
      // useAuthStore.getState() → accès au store hors composant React
      useAuthStore.getState().logout()
      
      // Redirige seulement si pas déjà sur /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api