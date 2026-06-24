/**
 * @file fiche.entity.ts
 * @description Entités domain pour les fiches journalières.
 *
 * MODIFICATION v2 :
 * ✅ conditionMeteo ajouté à FicheWithRelations (déplacé de Mission vers Fiche)
 */

// Types de base — correspondent aux enums Prisma
export type StatutFiche = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'

export type ConditionMeteo =
  | 'BEAU'
  | 'NUAGEUX'
  | 'PLUIE'
  | 'VENT_FORT'
  | 'BROUILLARD'

// ─── Entité Fiche (retour BDD sans relations) ─────────────────────────────────
export interface FicheEntity {
  id:             string
  date:           Date
  statut:         StatutFiche
  observations:   string | null
  conditionMeteo: ConditionMeteo | null   // ← sur la fiche, pas sur la mission
  brigadeId:      string
  createurId:     string
  validateurId:   string | null
  createdAt:      Date
  updatedAt:      Date
}

// ─── Fiche avec ses relations (retour API) ─────────────────────────────────────
export interface FicheWithRelations extends FicheEntity {
  brigade: {
    id:   string
    nom:  string
    chef: string
  }
  createur: {
    id:     string
    nom:    string
    prenom: string
  }
  validateur: {
    id:     string
    nom:    string
    prenom: string
  } | null
  missions: unknown[]   // missions détaillées dans MissionWithRelations
  _count: {
    missions: number
  }
}