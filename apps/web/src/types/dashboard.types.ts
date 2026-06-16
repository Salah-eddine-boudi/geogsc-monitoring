/**
 * @file dashboard.types.ts
 * @description Types Dashboard IGT — reflètent exactement la réponse API.
 */

export interface DashboardStats {
  kpis: {
    totalFiches: number
    fichesValidees: number
    fichesSoumises: number
    fichesBrouillon: number
    totalMissions: number
    conformes: number
    reserves: number
    nonConformes: number
    tauxConformite: number
  }
  evolutionJournaliere: {
    date: string
    missions: number
    conformes: number
    nonConformes: number
    taux: number
  }[]
  repartitionOuvrage: {
    type: string
    conformes: number
    reserves: number
    nonConformes: number
    total: number
  }[]
  repartitionNature: {
    nature: string
    total: number
  }[]
  comparaisonBrigades: {
    brigadeId: string
    brigade: string
    missions: number
    taux: number
    fichesSoumises: number
  }[]
  ncRecentes: {
    id: string
    ficheId: string
    date: string
    brigade: string
    typeOuvrage: string
    nature: string | null
    partieOuvrage: string | null
  }[]
}
