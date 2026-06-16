import api from './api'
import type { Fiche, FichesResponse, StatutFiche } from '../types/api.types'

export interface FichesFilters {
  statut?: StatutFiche
  page?: number
  limit?: number
}

export const fichesService = {

  async getAll(filters?: FichesFilters): Promise<FichesResponse> {
  const { data } = await api.get('/fiches', { params: filters })
  
  // Log pour voir la vraie structure de la réponse
  console.log('API /fiches response:', JSON.stringify(data, null, 2))
  
  return data
},

  async getById(id: string): Promise<Fiche> {
    const { data } = await api.get<{ success: true; fiche: Fiche }>(`/fiches/${id}`)
    return data.fiche
  },

  async create(payload: { date: string; observations?: string }): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>('/fiches', payload)
    return data.fiche
  },

  async update(id: string, payload: { observations?: string }): Promise<Fiche> {
    const { data } = await api.patch<{ success: true; fiche: Fiche }>(`/fiches/${id}`, payload)
    return data.fiche
  },

  async soumettre(id: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/soumettre`)
    return data.fiche
  },

  async valider(id: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/valider`)
    return data.fiche
  },

  async rejeter(id: string, motif: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/rejeter`, { motif })
    return data.fiche
  }
}