/**
 * @file create-controle.use-case.ts
 * @description Use-case : ajouter un contrôle topographique à une mission.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIO CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * M. AIT KADIR est sur le terrain, mission EN_COURS.
 * Il mesure la platine PLT-A-12 :
 *   ecartX = +3mm, ecartY = -2mm (tolérance ±5mm)
 * → Il saisit les mesures → contrôle CONFORME créé automatiquement
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. La mission doit exister → NotFoundError
 * 2. La brigade ne peut ajouter des contrôles qu'à ses missions → ForbiddenError
 * 3. La fiche parente doit être BROUILLON → AppError STATUT_INVALIDE
 *    → Impossible d'ajouter des contrôles à une fiche soumise/validée
 * 4. Le statut est calculé automatiquement par le repository
 *    → jamais passé par le frontend
 */

import type { IControleRepository, CreateControleData } from '../../domain/repositories/controle.repository.js'
import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { ControleEntity } from '../../domain/entities/controle.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type CreateControleInput = Omit<CreateControleData, 'missionId'> & {
  missionId: string
  userRole: string
  userBrigadeId: string | undefined
}

/**
 * Use-case CreateControle.
 *
 * @param input              - données du contrôle + infos utilisateur
 * @param controleRepository - contrat repository contrôles
 * @param missionRepository  - contrat repository missions
 * @param ficheRepository    - contrat repository fiches
 */
export async function createControleUseCase(
  input: CreateControleInput,
  controleRepository: IControleRepository,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<ControleEntity> {

  // ── ÉTAPE 1 — Vérifie que la mission existe ──────────────────────────────────
  const mission = await missionRepository.findById(input.missionId)
  if (!mission) throw new NotFoundError('Mission')

  // ── ÉTAPE 2 — Récupère la fiche parente ─────────────────────────────────────
  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // ── ÉTAPE 3 — Contrôle d'accès Brigade ──────────────────────────────────────
  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  // ── ÉTAPE 4 — La fiche doit être en BROUILLON ───────────────────────────────
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible d'ajouter un contrôle à une fiche en statut "${fiche.statut}". La fiche doit être en BROUILLON.`,
      400
    )
  }

  // ── ÉTAPE 5 — Crée le contrôle (statut calculé automatiquement) ─────────────
  return controleRepository.create({
    missionId: input.missionId,
    type: input.type,
    ecartX: input.ecartX,
    ecartY: input.ecartY,
    ecartZ: input.ecartZ,
    toleranceX: input.toleranceX,
    toleranceY: input.toleranceY,
    toleranceZ: input.toleranceZ,
    observations: input.observations
  })
}
