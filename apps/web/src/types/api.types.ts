/**
 * @file api.types.ts
 * @description Types TypeScript partagés — forme exacte des données de l'API.
 */

export type Role = 'BRIGADE' | 'IGT' | 'ADMIN'
export type StatutFiche = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'
export type StatutMission = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'
export type StatutControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'
export type TypeControle = 'IMPLANTATION' | 'ALTIMETRIE' | 'VERTICALITY' | 'RECEPTION' | 'CONTRADICTOIRE'

export type TypeOuvrage =
  | 'PLATINE'
  | 'POTEAU'
  | 'POTEAU_AV_BETONNAGE'
  | 'POTEAU_AP_BETONNAGE'
  | 'POUTRE_CREMAILLERE_AV_BETONNAGE'
  | 'POUTRE_CREMAILLERE_AP_BETONNAGE'
  | 'VOILE'
  | 'VOILE_AV_BETONNAGE'
  | 'VOILE_AP_BETONNAGE'
  | 'GRADIN'
  | 'CHAMBORD'
  | 'VOMITOIRE'
  | 'SEMELLE_FILANTE'
  | 'SEMELLE_ISOLEE'
  | 'DALLES'
  | 'MUR_SOUTENEMENT'
  | 'TERRASSEMENT'
  | 'ASSAINISSEMENT'
  | 'FONDATION'
  | 'VRD'
  | 'AUTRE'

export type CategorieAssainissement =
  | 'FOND_DE_FOUILLE'
  | 'FIL_EAU'
  | 'COTE_RADIER'
  | 'LIT_POSE'
  | 'COFFRAGE_VOILES_REGARD'
  | 'VOILE_REGARD_AP_BETONNAGE'
  | 'COFFRAGE_RADIER'
  | 'COFFRAGE_DALLE'
  | 'COFFRAGE_GROS_BETON'
  | 'GROS_BETON_AP_BETONNAGE'
  | 'IMPLANTATION_GENERAL'
  | 'AUTRE'

export type ZoneGSC = 'A' | 'B' | 'C' | 'D' | 'HORS_ZONE'
export type ConditionMeteo = 'BEAU' | 'NUAGEUX' | 'PLUIE' | 'VENT_FORT' | 'BROUILLARD'
export type NatureIntervention =
  | 'IMPLANTATION'
  | 'CONTROLE_GEOMETRIQUE'
  | 'CONTROLE_ALTIMETRIQUE'
  | 'RECEPTION'
  | 'CONTRADICTOIRE'
  | 'RELEVE_TOPOGRAPHIQUE'
  | 'PIQUETAGE'

export type AppareilMesure =
  | 'TRIMBLE_SX12'
  | 'TRIMBLE_S7'
  | 'LEICA_TS16'
  | 'LEICA_NA730'
  | 'GPS_TRIMBLE'
  | 'NIVEAU_OPTIQUE'
  | 'AUTRE'

export type StadeCollage =
  | 'AVANT_BETONNAGE'
  | 'APRES_BETONNAGE'
  | 'AVANT_SOUDURE'
  | 'APRES_SOUDURE'
  | 'RECEPTION_FINALE'

/**
 * ResultatControle — valeurs COMPLÈTES synchronisées BDD + export.
 * PAS d'abréviations (C/NC/R) — utiliser CONFORME/NON_CONFORME/RESERVE.
 */
export type ResultatControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

export interface User {
  id: string; nom: string; prenom: string; email: string; role: Role; brigadeId?: string
}

export interface Brigade {
  id: string; nom: string; chef: string; actif: boolean; createdAt: string
}

export interface Ouvrage {
  id: string; reference: string; designation: string; type: TypeOuvrage
  axe: string | null; niveau: string | null; actif: boolean
}

export interface Controle {
  id: string; type: TypeControle; statut: StatutControle
  ecartX: number | null; ecartY: number | null; ecartZ: number | null
  toleranceX: number | null; toleranceY: number | null; toleranceZ: number | null
  observations: string | null; missionId: string; createdAt: string
}

export interface Mission {
  id: string
  statut: StatutMission
  heureDebut: string | null
  heureFin:   string | null

  // Localisation
  zone:          ZoneGSC | null
  axe:           string | null
  fil:           string | null
  niveau:        string | null
  partieOuvrage: string | null

  // Intervention
  nature:          NatureIntervention | null
  appareil:        AppareilMesure | null
  travailRealise:  string | null
  stadeCollage:    StadeCollage | null

  // Résultat
  conditionMeteo: ConditionMeteo | null
  resultat:       ResultatControle | null
  observations:   string | null

  // Nouveaux champs CDC
  typeOuvrage?:             TypeOuvrage | null
  categorieAssainissement?: CategorieAssainissement | null
  ficheReference?:          string | null

  // Relations
  ficheId: string; ouvrageId: string
  ouvrage: {
    id: string; reference: string; designation: string; type: TypeOuvrage
    axe: string | null; niveau: string | null
  }
  controles: Controle[]
  _count: { controles: number }
}

export interface Fiche {
  id: string; date: string; statut: StatutFiche; observations: string | null
  brigadeId: string; createurId: string; validateurId: string | null
  brigade: { id: string; nom: string; chef: string }
  createur: { id: string; nom: string; prenom: string }
  validateur?: { id: string; nom: string; prenom: string } | null
  missions: Mission[]
  _count: { missions: number }
}

export interface RapportStats {
  periode: string
  brigade: { id: string; nom: string; chef: string }
  nbFichesValidees: number; nbMissions: number; nbControles: number
  nbConformes: number; nbReserves: number; nbNonConformes: number; tauxConformite: number
  ouvragesNonConformes: { reference: string; designation: string; nbNonConformes: number }[]
}

export interface ApiError {
  success: false; code: string; message: string
  errors?: { field: string; message: string }[]
}

export interface LoginResponse { success: true; token: string; user: User }

export interface FichesResponse {
  success: true; data: Fiche[]
  pagination: { total: number; page: number; limit: number }
  totalPages: number
}

export interface Pagination { total: number; page: number; limit: number }

export interface MissionFormData {
  ouvrageId: string
  zone?:          ZoneGSC
  axe?:           string
  fil?:           string
  niveau?:        string
  partieOuvrage?: string
  nature?:         NatureIntervention
  appareil?:       AppareilMesure
  travailRealise?: string
  stadeCollage?:   StadeCollage
  conditionMeteo?: ConditionMeteo
  resultat?:       ResultatControle
  observations?:   string
  typeOuvrage?:             TypeOuvrage
  categorieAssainissement?: CategorieAssainissement
  ficheReference?:          string
}

export type StatutCP = 'BROUILLON' | 'SOUMIS' | 'VALIDE'
export type TypeEvenement = 'VISITE_CHANTIER' | 'REUNION' | 'INCIDENT' | 'CONSTAT' | 'AUTRE'
export type CriticiteVigilance = 'HAUTE' | 'MOYENNE' | 'FAIBLE'

export interface EvenementCP {
  id: string; date: string; type: TypeEvenement; description: string
  participants: string | null; lieu: string | null; cpId: string; createdAt: string
}

export interface PointVigilanceCP {
  id: string; criticite: CriticiteVigilance; description: string
  action: string | null; responsable: string | null; echeance: string | null
  resolu: boolean; cpId: string; createdAt: string
}

export interface CompteRenduCP {
  id: string; semaine: number; annee: number; statut: StatutCP
  observations: string | null; brigadeId: string; createurId: string
  brigade: { id: string; nom: string; chef: string }
  createur: { id: string; nom: string; prenom: string }
  evenements: EvenementCP[]; pointsVigilance: PointVigilanceCP[]
  _count?: { evenements: number; pointsVigilance: number }
  createdAt: string; updatedAt: string
}