/**
 * @file update-brigade.use-case.ts
 * @description Use-case : modifier une brigade existante.
 *
 * ACCÈS : ADMIN uniquement
 *
 * SCÉNARIOS CONCRETS :
 * 1. Changement de chef d'équipe :
 *    Brigade 02 : M. TAKI → M. RACHIDI (nouveau chef nommé)
 *
 * 2. Suspension d'une brigade :
 *    Équipe 04 suspendue pendant l'arrêt Aid Al-Fitr
 *    ADMIN met actif: false → la brigade ne peut plus soumettre de fiches
 *
 * 3. Réactivation :
 *    Après la reprise → ADMIN met actif: true
 *
 * RÈGLES MÉTIER :
 * 1. La brigade doit exister → NotFoundError sinon
 * 2. Si on change le nom → vérifier l'unicité
 * 3. Seuls les champs fournis sont modifiés (PATCH, pas PUT)
 */

import type { IBrigadeRepository } from '../../domain/brigade.repository.js'
import type { BrigadeEntity } from '../../domain/entities/brigade.entity.js'
import { NotFoundError, ConflictError } from '../../domain/errors.js'



export type UpdateBrigadeInput = {
  id: string  // brigade à modifier (obligatoire)
  nom?: string
  chef?: string
  actif?: boolean
}

/**
 * Use-case UpdateBrigade.
 *
 * @param input             - ID + champs à modifier
 * @param brigadeRepository - contrat repository
 */
export async function updateBrigadeUseCase(
  input: UpdateBrigadeInput,
  brigadeRepository: IBrigadeRepository
): Promise<BrigadeEntity> {

  
  const brigade = await brigadeRepository.findById(input.id)
  if (!brigade) {
    throw new NotFoundError('Brigade')
  }

  
  if (input.nom && input.nom !== brigade.nom) {
    // le nouveau nom est différent de l'actuel → vérifie doublon
    const existante = await brigadeRepository.findByNom(input.nom)
    if (existante) {
      throw new ConflictError(`Une brigade avec le nom "${input.nom}" existe déjà`)
    }
  }

  

  const { id, ...data } = input

  return brigadeRepository.update(id, data)
}