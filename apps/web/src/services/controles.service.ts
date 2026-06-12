import api from './api'
import type { Controle, TypeControle } from '../types/api.types'

export interface CreateControlePayload {
  type: TypeControle
  ecartX?: number
  ecartY?: number
  ecartZ?: number
  toleranceX?: number
  toleranceY?: number
  toleranceZ?: number
  observations?: string
}

export const controlesService = {

  async getAll(ficheId: string, missionId: string): Promise<Controle[]> {
    const { data } = await api.get<{ success: true; controles: Controle[] }>(
      `/fiches/${ficheId}/missions/${missionId}/controles`
    )
    return data.controles
  },

  async create(ficheId: string, missionId: string, payload: CreateControlePayload): Promise<Controle> {
    const { data } = await api.post<{ success: true; controle: Controle }>(
      `/fiches/${ficheId}/missions/${missionId}/controles`,
      payload
    )
    return data.controle
  },

  async update(ficheId: string, missionId: string, controleId: string, payload: Partial<CreateControlePayload>): Promise<Controle> {
    const { data } = await api.patch<{ success: true; controle: Controle }>(
      `/fiches/${ficheId}/missions/${missionId}/controles/${controleId}`,
      payload
    )
    return data.controle
  },

  async delete(ficheId: string, missionId: string, controleId: string): Promise<void> {
    await api.delete(`/fiches/${ficheId}/missions/${missionId}/controles/${controleId}`)
  }
}   