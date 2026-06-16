import api from './api'
import type { User, LoginResponse } from '../types/api.types'

export const authService = {

  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    return data
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ success: true; user: User }>('/auth/me')
    return data.user
  }
}