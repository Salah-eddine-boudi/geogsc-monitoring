/**
 * @file mission.entity.ts
 * @description Entité Mission pure — aucune dépendance externe.
 *
 * QU'EST-CE QU'UNE MISSION ?
 * C'est une intervention topographique spécifique effectuée
 * par une brigade dans une journée sur un ouvrage précis.
 *

 * RELATION :
 * FicheJournaliere (1) ──── (N) Mission (N) ──── (1) Ouvrage
 *
 * UNE fiche peut avoir PLUSIEURS missions.
 * Chaque mission concerne UN seul ouvrage.
 */

export type MissionEntity = {
  id: string
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
  heureDebut: Date | null   
  heureFin: Date | null     
  observations: string | null
  ficheId: string           
  ouvrageId: string         
  createdAt: Date
  updatedAt: Date
}

/**
 * Mission enrichie avec ses relations.
 * Utilisée pour l'affichage détaillé.
 *
 * SCÉNARIO :
 * IGT ouvre une fiche → voit toutes les missions avec
 * le nom de l'ouvrage et les contrôles effectués.
 */
export type MissionWithRelations = MissionEntity & {
  ouvrage: {
    id: string
    reference: string    // ex: "PLT-A-12"
    designation: string  // ex: "Platine charpente axe A-12"
    type: string         // ex: "PLATINE"
    axe: string | null   // ex: "Axe A"
    niveau: string | null // ex: "R+1"
  }
  controles: {
    id: string
    type: string
    statut: string
    ecartX: number | null
    ecartY: number | null
    ecartZ: number | null
    toleranceX: number | null
    toleranceY: number | null
    toleranceZ: number | null
    observations: string | null
  }[]
  _count: {
    controles: number
  }
}