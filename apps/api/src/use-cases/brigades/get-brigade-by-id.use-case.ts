/**
 * @file get-brigade-by-id.use-case.ts
 * @description Use-case : récupérer une brigade par son ID avec ses membres.
 *
 * SCÉNARIO CONCRET :
 * IGT Hakim clique sur "Équipe 01" dans le dashboard
 * → voit : Chef AIT KADIR + membres + leurs fiches du jour
 *
 * RÈGLE MÉTIER IMPORTANTE :
 * Une Brigade ne peut voir QUE sa propre brigade.
 * Un IGT/ADMIN peut voir n'importe quelle brigade.
 *
 * EXEMPLE :
 * Brigade 01 connectée → essaie de voir Brigade 02
 * → ForbiddenError (pas le droit)
 */

import type { IBrigadeRepository } from '../../domain/repositories/brigade.repository.js'
import type { BrigadeWithMembers } from '../../domain/entities/brigade.entity.js'
import { NotFoundError, ForbiddenError } from '../../domain/errors.js'

export type GetBrigadeByIdInput = {
  brigadeId: string   // ID de la brigade demandée
  userRole: string    // rôle de l'utilisateur connecté
  userBrigadeId: string | undefined  // brigade de l'utilisateur connecté
}

/**
 * Use-case GetBrigadeById.
 *
 * CONTRÔLE D'ACCÈS :
 * - ADMIN/IGT → accès à toute brigade
 * - BRIGADE   → accès seulement à SA brigade
 *
 * @param input             - ID brigade + infos utilisateur connecté
 * @param brigadeRepository - contrat repository
 */
export async function getBrigadeByIdUseCase(
  input: GetBrigadeByIdInput,
  brigadeRepository: IBrigadeRepository
): Promise<BrigadeWithMembers> {

  // RÈGLE MÉTIER : contrôle d'accès
  // Si l'utilisateur est une Brigade → il ne peut voir que SA brigade
  if (
    input.userRole === 'BRIGADE' &&
    input.userBrigadeId !== input.brigadeId
    // sa brigade ≠ brigade demandée → accès refusé
  ) {
    throw new ForbiddenError()
    // HTTP 403 — "tu es connecté mais tu n'as pas le droit"
  }

  // Cherche la brigade avec ses membres
  const brigade = await brigadeRepository.findById(input.brigadeId)

  // Brigade inexistante → 404
  if (!brigade) {
    throw new NotFoundError('Brigade')
  }

  return brigade
}