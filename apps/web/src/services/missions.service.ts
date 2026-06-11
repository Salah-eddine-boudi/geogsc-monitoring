import api from './api'
import type { Mission } from '../types/api.types'

export const missionsService = {

  async getAll(ficheId: string): Promise<Mission[]> {
    const { data } = await api.get<{ success: true; missions: Mission[] }>(
      `/fiches/${ficheId}/missions`
    )
    return data.missions
  },

  async create(ficheId: string, payload: { ouvrageId: string; observations?: string }): Promise<Mission> {
    const { data } = await api.post<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions`,
      payload
    )
    return data.mission
  },

  async update(ficheId: string, missionId: string, payload: {
    heureDebut?: string
    observations?: string
  }): Promise<Mission> {
    const { data } = await api.patch<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions/${missionId}`,
      payload
    )
    return data.mission
  },

  async terminer(ficheId: string, missionId: string, heureFin?: string): Promise<Mission> {
    const { data } = await api.post<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions/${missionId}/terminer`,
      heureFin ? { heureFin } : {}
    )
    return data.mission
  },

  async delete(ficheId: string, missionId: string): Promise<void> {
    await api.delete(`/fiches/${ficheId}/missions/${missionId}`)
  }
}