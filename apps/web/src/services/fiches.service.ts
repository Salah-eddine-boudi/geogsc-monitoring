/**
 * @file fiches.service.ts
 * @description Service HTTP fiches journalières.
 *
 * MODIFICATION :
 * ✅ rouvrir() ajouté — IGT/Admin donne accès au brigadier pour correction
 */

import api from './api'
import type { Fiche, FichesResponse, StatutFiche } from '../types/api.types'

export interface FichesFilters {
  statut?: StatutFiche
  page?:   number
  limit?:  number
}

export const fichesService = {

  async getAll(filters?: FichesFilters): Promise<FichesResponse> {
    const { data } = await api.get('/fiches', { params: filters })
    return data
  },

  async getById(id: string): Promise<Fiche> {
    const { data } = await api.get<{ success: true; fiche: Fiche }>(`/fiches/${id}`)
    return data.fiche
  },

  async create(payload: {
    date:            string
    conditionMeteo?: string
    observations?:   string
  }): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>('/fiches', payload)
    return data.fiche
  },

  async update(id: string, payload: { observations?: string }): Promise<Fiche> {
    const { data } = await api.patch<{ success: true; fiche: Fiche }>(`/fiches/${id}`, payload)
    return data.fiche
  },

  // Brigade envoie → fiche clôturée
  async soumettre(id: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/soumettre`)
    return data.fiche
  },

  // IGT/Admin rouvre → brigade peut corriger (IGT ne modifie rien lui-même)
  async rouvrir(id: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/rouvrir`)
    return data.fiche
  },

  async valider(id: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/valider`)
    return data.fiche
  },

  async rejeter(id: string, motif: string): Promise<Fiche> {
    const { data } = await api.post<{ success: true; fiche: Fiche }>(`/fiches/${id}/rejeter`, { motif })
    return data.fiche
  },
}