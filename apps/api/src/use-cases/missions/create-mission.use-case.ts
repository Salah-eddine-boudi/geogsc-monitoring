/**
 * @file create-mission.use-case.ts
 * @description Use-case : créer une mission dans une fiche journalière.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIO CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 09h00 — M. AIT KADIR commence sa première mission :
 * "Contrôle implantation platines charpente — Axe A"
 * → Il sélectionne l'ouvrage PLT-A-01 dans la liste
 * → La mission est créée en PLANIFIEE dans sa fiche du jour
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. La fiche doit exister → NotFoundError
 * 2. La fiche doit être en BROUILLON → AppError STATUT_INVALIDE
 * 3. La brigade ne peut ajouter des missions qu'à SA fiche → ForbiddenError
 * 4. L'ouvrage doit exister ET être actif → NotFoundError
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { IOuvrageRepository } from '../../domain/repositories/ouvrage.repository.js'
import type { MissionEntity } from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type CreateMissionInput = {
  ficheId: string
  ouvrageId: string
  observations?: string
  userBrigadeId: string | undefined
  userRole: string
}

/**
 * Use-case CreateMission.
 *
 * @param input             - données de la mission
 * @param missionRepository - contrat repository missions
 * @param ficheRepository   - contrat repository fiches
 * @param ouvrageRepository - contrat repository ouvrages
 */
export async function createMissionUseCase(
  input: CreateMissionInput,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository,
  ouvrageRepository: IOuvrageRepository
): Promise<MissionEntity> {

  // ── ÉTAPE 1 — Vérifie que la fiche existe ───────────────────────────────────
  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // ── ÉTAPE 2 — Vérifie que c'est la fiche de cette brigade ───────────────────
  if (
    input.userRole === 'BRIGADE' &&
    fiche.brigadeId !== input.userBrigadeId
  ) {
    throw new ForbiddenError()
  }

  // ── ÉTAPE 3 — Vérifie que la fiche est en BROUILLON ─────────────────────────
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible d'ajouter une mission à une fiche en statut "${fiche.statut}". La fiche doit être en BROUILLON.`,
      400
    )
  }

  // ── ÉTAPE 4 — Vérifie que l'ouvrage existe et est actif ─────────────────────
  // On retourne NotFoundError dans les deux cas (inexistant ou inactif)
  // pour ne pas révéler qu'un ouvrage existe mais est désactivé
  const ouvrage = await ouvrageRepository.findById(input.ouvrageId)
  if (!ouvrage || !ouvrage.actif) {
    throw new NotFoundError('Ouvrage')
  }

  // ── ÉTAPE 5 — Crée la mission en PLANIFIEE ───────────────────────────────────
  return missionRepository.create({
    ficheId: input.ficheId,
    ouvrageId: input.ouvrageId,
    observations: input.observations
  })
}