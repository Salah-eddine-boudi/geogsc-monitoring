/**
 * @file photos.service.ts
 * @description Service frontend — upload de photos liées à une mission.
 * 
 * Le backend gère la compression (Sharp 1200px, JPEG 80%).
 * Le frontend envoie le fichier brut en multipart/form-data.
 */

import api from './api'

export interface PhotoUploaded {
  id:        string
  url:        string
  taille:     number
  createdAt:  string
}

export const photosService = {

  /**
   * Upload une ou plusieurs photos pour une mission.
   * @param ficheId    - ID de la fiche parente
   * @param missionId  - ID de la mission
   * @param files      - Liste de fichiers à uploader
   */
  async upload(
    ficheId:   string,
    missionId: string,
    files:     File[]
  ): Promise<PhotoUploaded[]> {
    const formData = new FormData()
    files.forEach(f => formData.append('photos', f))

    const { data } = await api.post<{ success: true; photos: PhotoUploaded[] }>(
      `/fiches/${ficheId}/missions/${missionId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return data.photos
  },

  /**
   * Supprime une photo.
   */
  async delete(ficheId: string, missionId: string, photoId: string): Promise<void> {
    await api.delete(`/fiches/${ficheId}/missions/${missionId}/photos/${photoId}`)
  },
}