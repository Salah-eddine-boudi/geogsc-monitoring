/**
 * @file missions.service.ts
 * @description Service HTTP missions.
 *
 * CORRECTIONS :
 * ✅ heureDebut ajouté dans UpdateMissionPayload
 * ✅ terminer() restauré (utilisé dans FicheDetailPage)
 */

import api from './api'
import type { Mission } from '../types/api.types'

// ─── PAYLOAD CRÉATION ────────────────────────────────────────────

export interface CreateMissionPayload {
  ouvrageId: string

  // §2 Localisation
  zone?:          string | null
  sousZone?:      string | null
  axe?:           string | null
  fil?:           string | null
  niveau?:        string | null
  partieOuvrage?: string | null

  // §3 Intervention
  nature?:             string | null
  stadeCollage?:       string | null
  provenanceAppareil?: string | null
  nomAppareil?:        string | null
  ecartMm?:            number | null
  travailRealise?:     string | null

  // §4 Résultat
  resultat?:       string | null
  observationsNc?: string | null

  // §5 Excel + observations
  typeOuvrage?:             string | null
  categorieAssainissement?: string | null
  ficheReference?:          string | null
  observations?:            string | null
}

// ─── PAYLOAD MISE À JOUR ─────────────────────────────────────────

export type UpdateMissionPayload = Partial<CreateMissionPayload & {
  heureDebut: string   // ISO string — déclenche EN_COURS côté serveur
  heureFin:   string   // ISO string — déclenche TERMINEE côté serveur
  statut:     string
}>

// ─── SERVICE ─────────────────────────────────────────────────────

export const missionsService = {

  async getAll(ficheId: string): Promise<Mission[]> {
    const { data } = await api.get<{ success: true; missions: Mission[] }>(
      `/fiches/${ficheId}/missions`
    )
    return data.missions
  },

  async create(ficheId: string, payload: CreateMissionPayload): Promise<Mission> {
    const { data } = await api.post<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions`,
      payload
    )
    return data.mission
  },

  async update(
    ficheId:   string,
    missionId: string,
    payload:   UpdateMissionPayload
  ): Promise<Mission> {
    const { data } = await api.patch<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions/${missionId}`,
      payload
    )
    return data.mission
  },

  /**
   * Démarre une mission — raccourci pour PATCH avec heureDebut.
   * Déclenche la transition PLANIFIEE → EN_COURS côté serveur.
   */
  async demarrer(ficheId: string, missionId: string): Promise<Mission> {
    const { data } = await api.patch<{ success: true; mission: Mission }>(
      `/fiches/${ficheId}/missions/${missionId}`,
      { heureDebut: new Date().toISOString() }
    )
    return data.mission
  },

  /**
   * Termine une mission — conservé pour compatibilité FicheDetailPage.
   * Appelle POST /:id/terminer si la route existe,
   * sinon PATCH avec heureFin.
   */
  async terminer(ficheId: string, missionId: string, heureFin?: string): Promise<Mission> {
    try {
      // Tente d'abord la route dédiée (ancienne architecture)
      const { data } = await api.post<{ success: true; mission: Mission }>(
        `/fiches/${ficheId}/missions/${missionId}/terminer`,
        heureFin ? { heureFin } : {}
      )
      return data.mission
    } catch {
      // Fallback : PATCH avec heureFin (nouvelle architecture)
      const { data } = await api.patch<{ success: true; mission: Mission }>(
        `/fiches/${ficheId}/missions/${missionId}`,
        { heureFin: heureFin ?? new Date().toISOString() }
      )
      return data.mission
    }
  },

  async delete(ficheId: string, missionId: string): Promise<void> {
    await api.delete(`/fiches/${ficheId}/missions/${missionId}`)
  },
}