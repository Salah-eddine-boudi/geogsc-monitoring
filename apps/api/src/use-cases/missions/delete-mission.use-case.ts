/**
 * @file delete-mission.use-case.ts
 * @description Use-case : supprimer une mission.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIO CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * M. AIT KADIR crée une mission par erreur :
 * "Contrôle gradins Tribune Sud" au lieu de "Tribune Nord"
 * → Il clique "Supprimer"
 * → La mission est supprimée
 * → Il recrée la bonne mission
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Mission doit exister → NotFoundError
 * 2. Brigade ne peut supprimer que ses propres missions
 * 3. Fiche doit être en BROUILLON
 *    → impossible de supprimer une mission soumise/validée
 *    → les données validées sont immuables pour la traçabilité
 *
 * POURQUOI PAS DE SOFT DELETE ?
 * Les missions supprimées sont des erreurs de saisie.
 * Pas besoin de les conserver — hard delete suffisant.
 * Les missions validées sont immuables de toute façon.
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type DeleteMissionInput = {
  missionId: string
  userRole: string
  userBrigadeId: string | undefined
}

/**
 * Use-case DeleteMission.
 *
 * @param input             - missionId + infos utilisateur
 * @param missionRepository - contrat repository missions
 * @param ficheRepository   - contrat repository fiches
 */
export async function deleteMissionUseCase(
  input: DeleteMissionInput,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<void> {

  // ── ÉTAPE 1 — Vérifie que la mission existe ──────────────────────────────────
  const mission = await missionRepository.findById(input.missionId)
  if (!mission) throw new NotFoundError('Mission')

  // ── ÉTAPE 2 — Récupère la fiche parente ─────────────────────────────────────
  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // ── ÉTAPE 3 — Contrôle d'accès Brigade ──────────────────────────────────────
  // Une brigade ne peut supprimer que ses propres missions
  if (
    input.userRole === 'BRIGADE' &&
    fiche.brigadeId !== input.userBrigadeId
  ) {
    throw new ForbiddenError()
  }

  // ── ÉTAPE 4 — Fiche doit être en BROUILLON ──────────────────────────────────
  // Impossible de supprimer une mission dans une fiche soumise/validée
  // → garantit l'intégrité des données validées
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible de supprimer une mission dans une fiche en statut "${fiche.statut}". Seules les fiches en BROUILLON permettent la suppression.`,
      400
    )
  }

  // ── ÉTAPE 5 — Supprime la mission ────────────────────────────────────────────
  await missionRepository.delete(input.missionId)
  // retourne void — pas de données à retourner après suppression
}