/**
 * @file valider-fiche.use-case.ts
 * @description Use-case : valider ou rejeter une fiche — réservé IGT/ADMIN.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Seul IGT/ADMIN peut valider ou rejeter
 * 2. Seule une fiche SOUMISE peut être validée/rejetée
 * 3. Le rejet nécessite un motif obligatoire
 * 4. Une fiche VALIDEE est immuable (jamais modifiable)
 */

import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { FicheEntity } from '../../domain/entities/fiche.entity.js'
import { NotFoundError, AppError } from '../../domain/errors.js'

/**
 * @property action      - 'VALIDER' ou 'REJETER'
 * @property validateurId - ID de l'IGT qui prend la décision
 * @property motif       - obligatoire si action = 'REJETER'
 */
export type ValiderFicheInput = {
  ficheId: string
  action: 'VALIDER' | 'REJETER'
  validateurId: string
  motif?: string  // obligatoire si REJETER
}

/**
 * @param input           - action + validateur + motif
 * @param ficheRepository - contrat repository
 */
export async function validerFicheUseCase(
  input: ValiderFicheInput,
  ficheRepository: IFicheRepository
): Promise<FicheEntity> {

  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

 
  if (fiche.statut !== 'SOUMISE') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible de ${input.action === 'VALIDER' ? 'valider' : 'rejeter'} une fiche en statut "${fiche.statut}". Seules les fiches SOUMISES peuvent être traitées.`,
      400
    )
  }


  if (input.action === 'REJETER' && !input.motif?.trim()) {
   
    throw new AppError(
      'MOTIF_REQUIS',
      'Un motif est obligatoire pour rejeter une fiche',
      400
    )
  }

  const nouveauStatut = input.action === 'VALIDER' ? 'VALIDEE' : 'REJETEE'

  return ficheRepository.updateStatut(input.ficheId, {
    statut: nouveauStatut,
    validateurId: input.validateurId,
    observations: input.action === 'REJETER' ? input.motif : undefined
  })
}