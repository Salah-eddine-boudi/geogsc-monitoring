/**
 * @file soumettre-fiche.use-case.ts
 * @description Use-case : soumettre une fiche pour validation IGT.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Seule la brigade propriétaire peut soumettre SA fiche
 * 2. La fiche doit être en BROUILLON pour être soumise
 *    → SOUMISE ne peut pas être soumise à nouveau
 *    → VALIDEE ne peut pas être soumise
 *    → REJETEE peut être soumise à nouveau (après correction)
 * 3. La fiche doit avoir au moins UNE mission
 *    → pas de fiche vide soumise à l'IGT
 */

import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { FicheEntity } from '../../domain/entities/fiche.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type SoumettreInput = {
  ficheId: string
  userId: string       // utilisateur qui soumet
  userBrigadeId: string | undefined  // brigade de l'utilisateur
}

/**

 * @param input           - ID fiche + utilisateur
 * @param ficheRepository - contrat repository
 */
export async function soumettreUseCase(
  input: SoumettreInput,
  ficheRepository: IFicheRepository
): Promise<FicheEntity> {

  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  if (fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

 
  const statutsAutorisés = ['BROUILLON', 'REJETEE'];

  if (!statutsAutorisés.includes(fiche.statut)) {
    
    throw new AppError(
      'STATUT_INVALIDE',
      `La fiche ne peut pas être soumise depuis le statut "${fiche.statut}"`,
      400
    )
  }

 
  if (fiche._count.missions === 0) {
    throw new AppError(
      'FICHE_VIDE',
      'La fiche doit contenir au moins une mission avant soumission',
      400
    )
  }


  return ficheRepository.updateStatut(input.ficheId, {
    statut: 'SOUMISE'
  
  })
}