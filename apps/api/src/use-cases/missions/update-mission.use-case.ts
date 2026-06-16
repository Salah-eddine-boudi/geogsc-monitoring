/**
 * @file update-mission.use-case.ts
 * @description Use-case : modifier observations et heureDebut d'une mission.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * DIFFÉRENCE AVEC terminer-mission :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * update-mission   → modifier observations, démarrer (PLANIFIEE → EN_COURS)
 * terminer-mission → terminer spécifiquement (EN_COURS → TERMINEE)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIOS :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Démarrer une mission :
 *    PLANIFIEE → EN_COURS + heureDebut = 09h00
 *
 * 2. Ajouter des observations :
 *    "Conditions météo difficiles — reprise après 14h"
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Mission doit exister → NotFoundError
 * 2. Brigade ne peut modifier que ses propres missions → ForbiddenError
 * 3. Fiche doit être en BROUILLON → AppError STATUT_INVALIDE
 * 4. Transition PLANIFIEE → EN_COURS automatique si heureDebut fournie
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { MissionEntity } from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type UpdateMissionInput = {
  missionId: string
  userRole: string
  userBrigadeId: string | undefined
  heureDebut?: Date
  observations?: string
}

/**
 * Use-case UpdateMission.
 *
 * @param input             - missionId + données à modifier
 * @param missionRepository - contrat repository missions
 * @param ficheRepository   - contrat repository fiches
 */
export async function updateMissionUseCase(
  input: UpdateMissionInput,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<MissionEntity> {

  // ── ÉTAPE 1 — Vérifie que la mission existe ──────────────────────────────────
  const mission = await missionRepository.findById(input.missionId)
  if (!mission) throw new NotFoundError('Mission')

  // ── ÉTAPE 2 — Récupère la fiche parente ─────────────────────────────────────
  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // ── ÉTAPE 3 — Contrôle d'accès Brigade ──────────────────────────────────────
  if (
    input.userRole === 'BRIGADE' &&
    fiche.brigadeId !== input.userBrigadeId
  ) {
    throw new ForbiddenError()
  }

  // ── ÉTAPE 4 — Fiche doit être en BROUILLON ──────────────────────────────────
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible de modifier une mission dans une fiche en statut "${fiche.statut}"`,
      400
    )
  }

  // ── ÉTAPE 5 — Construit les données à mettre à jour ─────────────────────────
  // On construit l'objet update explicitement
  // pour éviter d'envoyer des champs undefined à Prisma
  const updateData: Partial<{
    statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
    heureDebut: Date
    observations: string
  }> = {}

  // Si heureDebut fournie → démarrage automatique PLANIFIEE → EN_COURS
  if (input.heureDebut !== undefined) {
    updateData.heureDebut = input.heureDebut

    if (mission.statut === 'PLANIFIEE') {
      // Transition automatique → EN_COURS
      updateData.statut = 'EN_COURS'
    }
  }

  // Si observations fournies → mise à jour
  if (input.observations !== undefined) {
    updateData.observations = input.observations
  }

  // ── ÉTAPE 6 — Met à jour ─────────────────────────────────────────────────────
  return missionRepository.update(input.missionId, updateData)
}