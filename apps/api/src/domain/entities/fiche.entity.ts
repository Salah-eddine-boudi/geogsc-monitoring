/**
 * @file fiche.entity.ts
 * @description Entité FicheJournaliere pure.
 *
 * QU'EST-CE QU'UNE FICHE JOURNALIÈRE ?
 * C'est le document principal du contrôle topographique.
 * Chaque brigade remplit UNE fiche par jour.
 * Elle regroupe toutes les missions effectuées dans la journée.
 *
 * RÈGLE MÉTIER IMPORTANTE :
 * Une brigade ne peut avoir qu'UNE seule fiche par jour.
 * → contrainte @unique([brigadeId, date]) dans le schema Prisma
 *
 * SCÉNARIO QUOTIDIEN :
 * 08h00 — Brigade 01 crée sa fiche du jour (BROUILLON)
 * 10h30 — Ajoute Mission 1 : contrôle platines Axe A
 * 14h00 — Ajoute Mission 2 : implantation poteaux Tribune Nord
 * 16h30 — Soumet la fiche (SOUMISE)
 * 17h00 — IGT Hakim valide (VALIDEE) ou rejette avec motif (REJETEE)
 */

export type FicheEntity = {
  id: string
  date: Date
  statut: 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'
  observations: string | null
  brigadeId: string
  createurId: string
  validateurId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Fiche enrichie avec les relations.
 * Utilisée pour l'affichage détaillé.
 */
export type FicheWithRelations = FicheEntity & {
  brigade: {
    id: string
    nom: string
    chef: string
  }
  createur: {
    id: string
    nom: string
    prenom: string
  }
  validateur: {
    id: string
    nom: string
    prenom: string
  } | null
  missions: {
    id: string
    statut: string
    heureDebut: Date | null
    heureFin: Date | null
    observations: string | null
    ouvrage: {
      id: string
      reference: string
      designation: string
      type: string
    }
  }[]
  _count: {
    missions: number
  }
}