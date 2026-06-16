/**
 * @file cp.service.ts
 * @description Service CP — appels API Comptes Rendus hebdomadaires.
 */

import api from './api'
import type {
  CompteRenduCP, EvenementCP,
  PointVigilanceCP, TypeEvenement, CriticiteVigilance
} from '../types/api.types'

export const cpService = {

  async getBrigadeCPs(brigadeId: string, annee?: number): Promise<CompteRenduCP[]> {
    const { data } = await api.get<{ success: true; cps: CompteRenduCP[] }>(
      `/cp/${brigadeId}`,
      { params: annee ? { annee } : {} }
    )
    return data.cps
  },

  async getById(brigadeId: string, cpId: string): Promise<CompteRenduCP> {
    const { data } = await api.get<{ success: true; cp: CompteRenduCP }>(
      `/cp/${brigadeId}/${cpId}`
    )
    return data.cp
  },

  async create(payload: {
    semaine: number
    annee: number
    brigadeId: string
    observations?: string
  }): Promise<CompteRenduCP> {
    const { data } = await api.post<{ success: true; cp: CompteRenduCP }>('/cp', payload)
    return data.cp
  },

  async addEvenement(cpId: string, payload: {
    date: string
    type: TypeEvenement
    description: string
    participants?: string
    lieu?: string
  }): Promise<EvenementCP> {
    const { data } = await api.post<{ success: true; evenement: EvenementCP }>(
      `/cp/${cpId}/evenements`, payload
    )
    return data.evenement
  },

  async deleteEvenement(cpId: string, evId: string): Promise<void> {
    await api.delete(`/cp/${cpId}/evenements/${evId}`)
  },

  async addVigilance(cpId: string, payload: {
    criticite: CriticiteVigilance
    description: string
    action?: string
    responsable?: string
    echeance?: string
  }): Promise<PointVigilanceCP> {
    const { data } = await api.post<{ success: true; vigilance: PointVigilanceCP }>(
      `/cp/${cpId}/vigilances`, payload
    )
    return data.vigilance
  },

  async deleteVigilance(cpId: string, vId: string): Promise<void> {
    await api.delete(`/cp/${cpId}/vigilances/${vId}`)
  },

  async soumettre(cpId: string): Promise<CompteRenduCP> {
    const { data } = await api.post<{ success: true; cp: CompteRenduCP }>(
      `/cp/${cpId}/soumettre`
    )
    return data.cp
  }
}