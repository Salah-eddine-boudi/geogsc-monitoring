/**
 * @file create-mission.use-case.ts
 * @description Use-case : créer une mission dans une fiche journalière.
 *
 * SCÉNARIO :
 * 09h00 — M. AIT KADIR commence sa première mission :
 * → Contrôle implantation platines — Zone D, Axe D03/D05, fil M/N, R+1
 * → Appareil : Trimble SX12
 * → Résultat : C (Conforme)
 *
 * RÈGLES MÉTIER :
 * 1. La fiche doit exister
 * 2. La fiche doit être en BROUILLON
 * 3. La brigade ne peut ajouter des missions qu'à SA fiche
 * 4. L'ouvrage doit exister ET être actif
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { IOuvrageRepository } from '../../domain/repositories/ouvrage.repository.js'
import type { MissionEntity } from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

/**
 * Type d'entrée du use-case.
 *
 * POURQUOI REDÉCLARER LES TYPES ICI ?
 * Le use-case ne connaît pas Zod ni Prisma — Clean Architecture.
 * Il reçoit des données déjà validées depuis la route.
 * Il passe des données typées au repository.
 * Chaque couche a ses propres types.
 */
export type CreateMissionInput = {
  // ── Obligatoire ────────────────────────────────────────────────
  ficheId:   string
  ouvrageId: string

  // ── Localisation ──────────────────────────────────────────────
  zone?:          string   // Zone A/B/C/D du stade
  axe?:           string   // ex: "Axe D03/D05"
  fil?:           string   // ex: "fil M/N"
  niveau?:        string   // ex: "R+1", "SSL"
  partieOuvrage?: string   // ex: "Crémaillère intermédiaire"

  // ── Intervention ──────────────────────────────────────────────
  nature?:         string  // NatureIntervention enum
  appareil?:       string  // AppareilMesure enum
  travailRealise?: string  // description libre
  stadeCollage?:   string  // StadeCollage enum

  // ── Résultat ──────────────────────────────────────────────────
  conditionMeteo?: string  // ConditionMeteo enum
  resultat?:       string  // "C", "NC" ou "R"
  observations?:   string

  // ── Auth ──────────────────────────────────────────────────────
  userBrigadeId: string | undefined
  userRole:      string
}

export async function createMissionUseCase(
  input: CreateMissionInput,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository,
  ouvrageRepository: IOuvrageRepository
): Promise<MissionEntity> {

  // ── ÉTAPE 1 — Vérifie que la fiche existe ─────────────────────
  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // ── ÉTAPE 2 — Contrôle d'accès Brigade ────────────────────────
  if (
    input.userRole === 'BRIGADE' &&
    fiche.brigadeId !== input.userBrigadeId
  ) {
    throw new ForbiddenError()
  }

  // ── ÉTAPE 3 — Fiche doit être en BROUILLON ────────────────────
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible d'ajouter une mission à une fiche "${fiche.statut}". La fiche doit être en BROUILLON.`,
      400
    )
  }

  // ── ÉTAPE 4 — Vérifie l'ouvrage ───────────────────────────────
  const ouvrage = await ouvrageRepository.findById(input.ouvrageId)
  if (!ouvrage || !ouvrage.actif) {
    throw new NotFoundError('Ouvrage')
  }

  // ── ÉTAPE 5 — Crée la mission avec tous les champs CDC ─────────
  // On extrait les champs auth (non sauvegardés en BDD)
  // et on passe tout le reste au repository
  const { userBrigadeId, userRole, ficheId, ...data } = input

  return missionRepository.create({
    ficheId,
    ...data  // contient ouvrageId + tous les nouveaux champs
  })
}