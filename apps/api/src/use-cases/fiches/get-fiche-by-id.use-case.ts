/**
 * @file get-fiche-by-id.use-case.ts
 * @description Use-case : récupérer une fiche complète par son ID.
 */

import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { FicheWithRelations } from '../../domain/entities/fiche.entity.js'
import { NotFoundError, ForbiddenError } from '../../domain/errors.js'

export type GetFicheByIdInput = {
  ficheId: string
  userRole: string
  userBrigadeId: string | undefined
}

/**
 * Use-case GetFicheById.
 *
 * @param input           - ID fiche + infos utilisateur
 * @param ficheRepository - contrat repository
 */
export async function getFicheByIdUseCase(
  input: GetFicheByIdInput,
  ficheRepository: IFicheRepository
): Promise<FicheWithRelations> {

  
  const fiche = await ficheRepository.findById(input.ficheId)


  if (!fiche) {
    throw new NotFoundError('Fiche journalière')
  }

  
  if (
    input.userRole === 'BRIGADE' &&
    fiche.brigadeId !== input.userBrigadeId
    
  ) {
    throw new ForbiddenError()
    
  }

  return fiche
}