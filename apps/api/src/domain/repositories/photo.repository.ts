/**
 * @file photo.repository.ts
 * @description Contrat (Interface) pour le stockage des photos.
 */

export interface IPhotoRepository {
  create(data: { 
    missionId: string; 
    url: string; 
    taille: number 
  }): Promise<{ id: string; url: string; createdAt: Date }>;
}