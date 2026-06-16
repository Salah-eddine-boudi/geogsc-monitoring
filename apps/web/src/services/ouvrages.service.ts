import api from './api'
import type { Ouvrage } from '../types/api.types'

export const ouvragesService = {

  async getAll(): Promise<Ouvrage[]> {
    const { data } = await api.get<{ success: true; ouvrages: Ouvrage[] }>('/ouvrages')
    return data.ouvrages
  },

  async getById(id: string): Promise<Ouvrage> {
    const { data } = await api.get<{ success: true; ouvrage: Ouvrage }>(`/ouvrages/${id}`)
    return data.ouvrage
  }
}