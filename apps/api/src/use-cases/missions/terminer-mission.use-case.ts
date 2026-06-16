/**
 * @file terminer-mission.use-case.ts
 * @description Use-case : terminer une mission EN_COURS.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIO CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 16h00 — M. AIT KADIR termine le contrôle platines Axe A
 * → clique "Terminer la mission"
 * → statut : EN_COURS → TERMINEE
 * → heureFin = 16h00 (fournie ou automatique)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * MACHINE À ÉTATS :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PLANIFIEE → TERMINEE ❌ (doit passer par EN_COURS d'abord)
 * EN_COURS  → TERMINEE ✅
 * TERMINEE  → TERMINEE ❌ (déjà terminée)
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * POURQUOI SÉPARER DE update-mission ?
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * La terminaison a des règles spécifiques :
 * - Mission DOIT être EN_COURS
 * - heureFin automatique si non fournie
 * - Peut déclencher des notifications (future évolution)
 * - Règle métier : heureFin > heureDebut
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { MissionEntity } from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type TerminerMissionInput = {
  missionId: string
  userRole: string
  userBrigadeId: string | undefined
  heureFin?: Date  // si non fournie → maintenant automatiquement
}

/**
 * Use-case TerminerMission.
 *
 * @param input             - missionId + heureFin optionnelle
 * @param missionRepository - contrat repository missions
 * @param ficheRepository   - contrat repository fiches
 */
export async function terminerMissionUseCase(
  input: TerminerMissionInput,
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
      `Impossible de terminer une mission dans une fiche en statut "${fiche.statut}"`,
      400
    )
  }

  // ── ÉTAPE 5 — Mission doit être EN_COURS ────────────────────────────────────
  // PLANIFIEE → doit d'abord démarrer via update-mission
  // TERMINEE  → déjà terminée
  if (mission.statut !== 'EN_COURS') {
    throw new AppError(
      'STATUT_INVALIDE',
      `La mission doit être EN_COURS pour être terminée. Statut actuel : "${mission.statut}"`,
      400
    )
  }

  // ── ÉTAPE 6 — Vérifie que heureFin > heureDebut ─────────────────────────────
  const heureFin = input.heureFin ?? new Date()
  // ?? → si heureFin non fournie → maintenant

  if (mission.heureDebut && heureFin < mission.heureDebut) {
    // L'heure de fin ne peut pas être avant l'heure de début
    throw new AppError(
      'HEURE_INVALIDE',
      'L\'heure de fin ne peut pas être antérieure à l\'heure de début',
      400
    )
  }

  // ── ÉTAPE 7 — Termine la mission ────────────────────────────────────────────
  return missionRepository.update(input.missionId, {
    statut: 'TERMINEE',
    heureFin
  })
}