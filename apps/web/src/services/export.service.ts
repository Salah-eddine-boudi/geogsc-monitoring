/**
 * @file export.service.ts
 * @description Service frontend — appels API export Excel hebdomadaire.
 */

import api from './api.js'

export interface SemaineDisponible {
  semaine: number
  annee:   number
  debut:   string
  fin:     string
  label:   string  // "Semaine 23 — du 01/06/2026 au 07/06/2026"
}

export const exportService = {

  /**
   * Récupère les semaines disponibles (fiches VALIDÉES) pour une brigade et une année.
   */
  async getSemaines(brigadeId: string, annee: number): Promise<SemaineDisponible[]> {
    const { data } = await api.get(`/export/semaines/${brigadeId}/${annee}`)
    return data.data
  },

  /**
   * Télécharge le rapport Excel de la semaine.
   * Déclenche le téléchargement automatique dans le navigateur.
   */
  async telechargerSemaine(brigadeId: string, annee: number, semaine: number): Promise<void> {
    const response = await api.get(
      `/export/excel/${brigadeId}/${annee}/${semaine}`,
      { responseType: 'blob' }
    )

    // Créer un lien temporaire pour déclencher le téléchargement
    const url  = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `Rapport_Topo_GSC_S${semaine}_${annee}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}