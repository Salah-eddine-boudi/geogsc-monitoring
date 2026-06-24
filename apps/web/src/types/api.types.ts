/**
 * @file api.types.ts
 * @description Types TypeScript partagés — forme exacte des données de l'API.
 *
 * MODIFICATIONS v2 :
 * Mission       → +sousZone, +periode, +ecartMm, +observationsNc (nouveaux champs BDD)
 * MissionFormData → idem
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
  | 'FIXATION_BOULONS_CREMAILLERES_AV_BETONNAGE'
  | 'FIXATION_BOULONS_CREMAILLERES_AP_BETONNAGE'
  | 'SUPPORT_GRADIN'
  | 'DALLES_AV_BETONNAGE'
  | 'DALLES_AP_BETONNAGE'
  | 'IMPLANTATION_GENERAL'
  | 'LIT_POSE'
  | 'COFFRAGE_VOILES_REGARD'
  | 'VOILE_REGARD_AP_BETONNAGE'
  | 'COFFRAGE_RADIER'
  | 'COFFRAGE_DALLE'
  | 'COFFRAGE_GROS_BETON'
  | 'GROS_BETON_AP_BETONNAGE'
  | 'PIEUX_IMPLANTATION'
  | 'PIEUX_EXCENTREMENT_AV'
  | 'PIEUX_EXCENTREMENT_AP'
  | 'ASS_FOND_FOUILLE'
  | 'ASS_FIL_EAU'
  | 'ASS_LIT_POSE'
  | 'ASS_COFFRAGE_VOILES_REGARD'
  | 'ASS_VOILE_REGARD_AP_BETONNAGE'
  | 'ASS_COFFRAGE_RADIER'
  | 'ASS_COTE_RADIER'
  | 'ASS_COFFRAGE_DALLE'
  | 'ASS_DALL_AP_BETONNAGE'
  | 'ASS_COFFRAGE_GROS_BETON'
  | 'ASS_GROS_BETON_AP_BETONNAGE'
  | 'ASS_IMPLANTATION_GENERAL'


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
  | 'DALL_AP_BETONNAGE'
  | 'AUTRE'

export type ZoneGSC = 'A' | 'B' | 'C' | 'D' | 'HORS_ZONE'
export type ConditionMeteo = 'BEAU' | 'NUAGEUX' | 'PLUIE' | 'VENT_FORT' | 'BROUILLARD'

export type NatureIntervention =
  | 'IMPLANTATION'
  | 'CONTROLE_IMPLANTATION'
  | 'CONTROLE_COFFRAGE'
  | 'CONTROLE_VERTICALITE'
  | 'CONTROLE_NIVELLEMENT'
  | 'CONTROLE_PLANEITE'
  | 'RECEPTION_AVANT_BETONNAGE'
  | 'RECEPTION_APRES_BETONNAGE'
  | 'RECEPTION_APRES_DECOFFRAGE'
  | 'CONTROLE_FOND_FOUILLE'
  | 'CONTROLE_FIL_EAU'
  | 'CONTROLE_COTE_RADIER'
  | 'LEVE_CONTRADICTOIRE'
  | 'LEVE_AS_BUILT'
  | 'CONTROLE_PENTE'
  | 'AUTRE'
  | 'CONTROLE_GEOMETRIQUE'
  | 'CONTROLE_ALTIMETRIQUE'
  | 'CONTROLE_NIVELLEMNT'
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

export type ProvenanceAppareil = 'GEOCODING' | 'ENTREPRISE'

export type StadeCollage =
  | 'PREMIER_COLLAGE'
  | 'DEUXIEME_COLLAGE'
  | 'TROISIEME_COLLAGE'
  | 'PREMIERE_LEVEE'
  | 'DEUXIEME_LEVEE'
  | 'TROISIEME_LEVEE'
  | 'LEVEE_FINALE'
  | 'NA'
  | 'AVANT_BETONNAGE'
  | 'APRES_BETONNAGE'
  | 'AVANT_SOUDURE'
  | 'APRES_SOUDURE'
  | 'RECEPTION_FINALE'

export type ResultatControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

// ─────────────────────────────────────────────────────────────────────────────

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
  id:     string
  statut: StatutMission
  heureDebut: string | null
  heureFin:   string | null

  // ── Localisation ──────────────────────────────────────────────
  zone:          ZoneGSC | null
  sousZone:      string | null        // NEW v2 — sous-zone libre
  axe:           string | null
  fil:           string | null
  niveau:        string | null
  partieOuvrage: string | null

  // ── Intervention ──────────────────────────────────────────────
  nature:             NatureIntervention | null
  appareil:           AppareilMesure | null
  provenanceAppareil: ProvenanceAppareil | null
  nomAppareil:        string | null   // NEW v2 — nom libre appareil
  travailRealise:     string | null
  stadeCollage:       StadeCollage | null
  periode:            string | null   // NEW v2 — JOUR | NUIT
  ecartMm:            number | null   // NEW v2 — écart mesuré (mm)

  // ── Résultat ──────────────────────────────────────────────────
  resultat:       ResultatControle | null
  observationsNc: string | null       // NEW v2 — détail si NC
  observations:   string | null
  estNC?:         boolean

  // ── Champs CDC export Excel ────────────────────────────────────
  typeOuvrage:             TypeOuvrage | null
  categorieAssainissement: CategorieAssainissement | null
  ficheReference:          string | null

  // ── Relations ─────────────────────────────────────────────────
  ficheId: string
  ouvrageId: string
  ouvrage: {
    id: string; reference: string; designation: string; type: TypeOuvrage
    axe: string | null; niveau: string | null
  }
  controles: Controle[]
  _count: { controles: number }
}

export interface Fiche {
  id: string; date: string; statut: StatutFiche; observations: string | null
  conditionMeteo: ConditionMeteo | null
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

// ─────────────────────────────────────────────────────────────────────────────

export interface MissionFormData {
  ouvrageId: string

  // Localisation
  zone?:          ZoneGSC
  sousZone?:      string              // NEW v2
  axe?:           string
  fil?:           string
  niveau?:        string
  partieOuvrage?: string

  // Intervention
  nature?:             NatureIntervention
  appareil?:           AppareilMesure
  provenanceAppareil?: ProvenanceAppareil
  nomAppareil?:        string         // NEW v2
  travailRealise?:     string
  stadeCollage?:       StadeCollage
  periode?:            string         // NEW v2
  ecartMm?:            number         // NEW v2

  // Résultat
  resultat?:       ResultatControle
  observationsNc?: string             // NEW v2
  observations?:   string

  // Export Excel
  typeOuvrage?:             TypeOuvrage
  categorieAssainissement?: CategorieAssainissement
  ficheReference?:          string
}

// ─────────────────────────────────────────────────────────────────────────────

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