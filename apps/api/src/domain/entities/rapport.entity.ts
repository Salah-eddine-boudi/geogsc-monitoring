/**
 * @file rapport.entity.ts
 * @description Entité Rapport — synthèse mensuelle des contrôles topographiques.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONTEXTE MÉTIER GSC :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Chaque mois, M. CHAACHOUI (IGT) génère un rapport
 * pour chaque brigade. Ce rapport est transmis à
 * M. BOUKBECH (Directeur) et archivé pour traçabilité.
 *
 * EXEMPLE :
 * Rapport Mai 2026 — Brigade Équipe 01 (M. AIT KADIR)
 * → 22 fiches validées
 * → 87 missions effectuées
 * → 234 contrôles : 198 CONFORMES (84.6%) / 24 RESERVES / 12 NON_CONFORMES
 * → Taux conformité : 84.6%
 * → 3 ouvrages NON_CONFORMES nécessitent action corrective
 */

export type RapportEntity = {
  id: string
  periode: string          // format "2026-05" (YYYY-MM)
  brigadeId: string
  generateurId: string     // IGT qui a généré le rapport

  // Statistiques calculées
  nbFichesValidees: number
  nbMissions: number
  nbControles: number
  nbConformes: number
  nbReserves: number
  nbNonConformes: number
  tauxConformite: number   // pourcentage 0-100

  observations: string | null
  createdAt: Date
}

export type RapportWithRelations = RapportEntity & {
  brigade: {
    id: string
    nom: string
    chef: string
  }
  generateur: {
    id: string
    nom: string
    prenom: string
  }
}

export type RapportStats = {
  periode: string
  brigade: {
    id: string
    nom: string
    chef: string
  }
  nbFichesValidees: number
  nbMissions: number
  nbControles: number
  nbConformes: number
  nbReserves: number
  nbNonConformes: number
  tauxConformite: number
  ouvragesNonConformes: {
    reference: string
    designation: string
    nbNonConformes: number
  }[]
}