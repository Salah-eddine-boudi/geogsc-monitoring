import api from './api'
import type { RapportStats } from '../types/api.types'

export const rapportsService = {

  async getRapport(brigadeId: string, periode: string): Promise<RapportStats> {
    const { data } = await api.get<{ success: true; rapport: RapportStats }>(
      `/rapports/${brigadeId}/${periode}`
    )
    return data.rapport
  },

  async getRapportsBrigade(brigadeId: string, annee?: number): Promise<RapportStats[]> {
    const { data } = await api.get<{ success: true; rapports: RapportStats[] }>(
      `/rapports/${brigadeId}`,
      { params: annee ? { annee } : {} }
    )
    return data.rapports
  }
}