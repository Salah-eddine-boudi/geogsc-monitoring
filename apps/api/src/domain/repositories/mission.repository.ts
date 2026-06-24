/**
 * @file mission.repository.ts
 * @description Interface contrat du repository missions.
 * Les use-cases dépendent de cette interface, jamais de Prisma directement.
 *
 * MODIFICATION v2 :
 * ✅ create() étendu avec tous les champs CDC v2
 *    (sousZone, provenanceAppareil, nomAppareil, periode, ecartMm,
 *     observationsNc, typeOuvrage, categorieAssainissement, ficheReference)
 */

import type { MissionEntity, MissionWithRelations } from '../entities/mission.entity.js'

// ─── TYPE DU PAYLOAD create() ────────────────────────────────────────────────

export type CreateMissionData = {
  // Obligatoires
  ficheId:   string
  ouvrageId: string

  // §2 Localisation
  zone?:          string
  sousZone?:      string   // NEW v2
  axe?:           string
  fil?:           string
  niveau?:        string
  partieOuvrage?: string

  // §3 Intervention
  nature?:             string
  stadeCollage?:       string
  provenanceAppareil?: string   // NEW v2
  nomAppareil?:        string   // NEW v2
  periode?:            string   // NEW v2
  ecartMm?:            number   // NEW v2
  travailRealise?:     string

  // §4 Résultat
  resultat?:       string
  observationsNc?: string       // NEW v2

  // §5 Observations + mapping Excel
  typeOuvrage?:             string
  categorieAssainissement?: string
  ficheReference?:          string
  observations?:            string
}

// ─── TYPE DU PAYLOAD update() ────────────────────────────────────────────────

export type UpdateMissionData = Partial<{
  statut:    'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
  heureDebut: Date
  heureFin:   Date

  // Localisation
  zone:          string
  sousZone:      string
  axe:           string
  fil:           string
  niveau:        string
  partieOuvrage: string

  // Intervention
  nature:             string
  stadeCollage:       string
  provenanceAppareil: string
  nomAppareil:        string
  periode:            string
  ecartMm:            number
  travailRealise:     string

  // Résultat
  resultat:       string
  observationsNc: string

  // Observations + Excel
  typeOuvrage:             string
  categorieAssainissement: string
  ficheReference:          string
  observations:            string
}>

// ─── INTERFACE ────────────────────────────────────────────────────────────────

export interface IMissionRepository {
  findByFiche(ficheId: string): Promise<MissionWithRelations[]>
  findById(id: string): Promise<MissionWithRelations | null>
  create(data: CreateMissionData): Promise<MissionEntity>
  update(id: string, data: UpdateMissionData): Promise<MissionEntity>
  delete(id: string): Promise<void>
}