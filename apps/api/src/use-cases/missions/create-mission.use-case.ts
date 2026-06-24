/**
 * @file create-mission.use-case.ts
 * @description Use-case : créer une réception (mission) dans une fiche journalière.
 * NB: "mission" dans le code, "réception" à l'affichage.
 *
 * RÈGLES MÉTIER :
 * 1. La fiche doit exister                          → NotFoundError
 * 2. Brigade : ne peut accéder qu'à SA fiche        → ForbiddenError
 * 3. La fiche doit être en BROUILLON                → AppError STATUT_INVALIDE
 * 4. L'ouvrage doit exister et être actif           → NotFoundError
 */

import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository }   from '../../domain/repositories/fiche.repository.js'
import type { IOuvrageRepository } from '../../domain/repositories/ouvrage.repository.js'
import type { MissionEntity }      from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type CreateMissionInput = {
  ficheId:       string
  ouvrageId:     string
  userBrigadeId: string | undefined
  userRole:      string

  zone?:          string
  sousZone?:      string
  axe?:           string
  fil?:           string
  niveau?:        string
  partieOuvrage?: string

  nature?:             string
  stadeCollage?:       string
  provenanceAppareil?: string
  nomAppareil?:        string
  periode?:            string
  ecartMm?:            number
  travailRealise?:     string

  resultat?:       string
  observationsNc?: string

  typeOuvrage?:             string
  categorieAssainissement?: string
  ficheReference?:          string
  observations?:            string
}

export async function createMissionUseCase(
  input: CreateMissionInput,
  missionRepository: IMissionRepository,
  ficheRepository:   IFicheRepository,
  ouvrageRepository: IOuvrageRepository
): Promise<MissionEntity> {

  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible d'ajouter une réception à une fiche en statut "${fiche.statut}". La fiche doit être en BROUILLON.`,
      400
    )
  }

  const ouvrage = await ouvrageRepository.findById(input.ouvrageId)
  if (!ouvrage || !ouvrage.actif) {
    throw new NotFoundError('Ouvrage')
  }

  return missionRepository.create({
    ficheId:   input.ficheId,
    ouvrageId: input.ouvrageId,
    zone:          input.zone,
    sousZone:      input.sousZone,
    axe:           input.axe,
    fil:           input.fil,
    niveau:        input.niveau,
    partieOuvrage: input.partieOuvrage,
    nature:             input.nature,
    stadeCollage:       input.stadeCollage,
    provenanceAppareil: input.provenanceAppareil,
    nomAppareil:        input.nomAppareil,
    periode:            input.periode,
    ecartMm:            input.ecartMm,
    travailRealise:     input.travailRealise,
    resultat:       input.resultat,
    observationsNc: input.observationsNc,
    typeOuvrage:             input.typeOuvrage,
    categorieAssainissement: input.categorieAssainissement,
    ficheReference:          input.ficheReference,
    observations:            input.observations,
  })
}