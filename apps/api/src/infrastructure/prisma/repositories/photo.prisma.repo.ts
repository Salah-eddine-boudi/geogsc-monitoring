/**
 * @file photo.prisma.repo.ts
 * @description Implémentation Prisma du repository photo.
 */

import { prisma } from '../prisma.js';
import type { IPhotoRepository } from '../../../domain/repositories/photo.repository.js';

export class PhotoPrismaRepository implements IPhotoRepository {
  /**
   * Crée un enregistrement de photo en base de données.
   * Utilise le typage explicite pour garantir la cohérence avec le modèle Prisma.
   */
  async create(data: { 
    missionId: string; 
    url: string; 
    taille: number 
  }) {
    // On attend explicitement la réponse pour respecter le contrat Promise
    return await prisma.photo.create({
      data: {
        missionId: data.missionId,
        url: data.url,
        taille: data.taille
      }
    });
  }
}