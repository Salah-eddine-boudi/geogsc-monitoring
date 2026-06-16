/**
 * @file ouvrage.repository.ts
 * @description Contrat repository pour les ouvrages.
 */

import type { OuvrageEntity } from '../entities/ouvrage.entity.js'

export interface IOuvrageRepository {
  findAll(includeInactive?: boolean): Promise<OuvrageEntity[]>
  findById(id: string): Promise<OuvrageEntity | null>
  findByReference(reference: string): Promise<OuvrageEntity | null>
}