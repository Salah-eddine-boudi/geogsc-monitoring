/**
 * @file api.types.ts
 * @description Types TypeScript partagés — forme exacte des données de l'API.
 *
 * RÈGLE :
 * Ces types doivent correspondre exactement aux réponses du backend.
 * Si le backend change, on met à jour ici → erreurs TypeScript
 * partout où le type a changé → on corrige tout d'un coup.
 */

// ─── ENUMS EXISTANTS ──────────────────────────────────────────────────────────

export type Role = 'BRIGADE' | 'IGT' | 'ADMIN'

export type StatutFiche = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'

export type StatutMission = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'

export type StatutControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

export type TypeControle =
  | 'IMPLANTATION'
  | 'ALTIMETRIE'
  | 'VERTICALITY'
  | 'RECEPTION'
  | 'CONTRADICTOIRE'

export type TypeOuvrage =
  | 'PLATINE'
  | 'POTEAU'
  | 'VOILE'
  | 'GRADIN'
  | 'FONDATION'
  | 'VRD'
  | 'AUTRE'

// ─── NOUVEAUX ENUMS CDC ───────────────────────────────────────────────────────

/**
 * Zones du Grand Stade de Casablanca.
 * Le stade est divisé en 4 tribunes identifiées A/B/C/D.
 */
export type ZoneGSC = 'A' | 'B' | 'C' | 'D' | 'HORS_ZONE'

/**
 * Conditions météorologiques au moment de l'intervention.
 * Impact direct sur la précision des mesures topographiques.
 * Ex: brouillard → réfraction atmosphérique → précision réduite.
 */
export type ConditionMeteo =
  | 'BEAU'
  | 'NUAGEUX'
  | 'PLUIE'
  | 'VENT_FORT'
  | 'BROUILLARD'

/**
 * Nature de l'intervention topographique.
 * Détermine les champs obligatoires dans le formulaire.
 * Ex: IMPLANTATION → écarts X/Y obligatoires
 *     CONTROLE_ALTIMETRIQUE → écart Z obligatoire
 */
export type NatureIntervention =
  | 'IMPLANTATION'
  | 'CONTROLE_GEOMETRIQUE'
  | 'CONTROLE_ALTIMETRIQUE'
  | 'RECEPTION'
  | 'CONTRADICTOIRE'
  | 'RELEVE_TOPOGRAPHIQUE'
  | 'PIQUETAGE'

/**
 * Instruments de mesure topographique disponibles sur le chantier GSC.
 * Trimble SX12 → tachéomètre scanning haute précision (±1mm à 100m)
 * Leica NA730  → niveau optique pour nivellement (±0.3mm/km)
 */
export type AppareilMesure =
  | 'TRIMBLE_SX12'
  | 'TRIMBLE_S7'
  | 'LEICA_TS16'
  | 'LEICA_NA730'
  | 'GPS_TRIMBLE'
  | 'NIVEAU_OPTIQUE'
  | 'AUTRE'

/**
 * Stade d'avancement de l'ouvrage au moment du contrôle.
 * AV = avant, AP = après
 * Détermine les tolérances applicables selon les plans d'exécution.
 */
export type StadeCollage =
  | 'AVANT_BETONNAGE'
  | 'APRES_BETONNAGE'
  | 'AVANT_SOUDURE'
  | 'APRES_SOUDURE'
  | 'RECEPTION_FINALE'

/**
 * Résultat du contrôle topographique.
 * C = Conforme, NC = Non conforme, R = Réserve
 */
export type ResultatControle = 'C' | 'NC' | 'R'

// ─── ENTITÉS ──────────────────────────────────────────────────────────────────

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  brigadeId?: string
}

export interface Brigade {
  id: string
  nom: string
  chef: string
  actif: boolean
  createdAt: string
}

export interface Ouvrage {
  id: string
  reference: string
  designation: string
  type: TypeOuvrage
  axe: string | null
  niveau: string | null
  actif: boolean
}

export interface Controle {
  id: string
  type: TypeControle
  statut: StatutControle

  ecartX: number | null
  ecartY: number | null
  ecartZ: number | null

  toleranceX: number | null
  toleranceY: number | null
  toleranceZ: number | null

  observations: string | null
  missionId: string
  createdAt: string
}

/**
 * Mission topographique — interface complète CDC.
 *
 * Contient tous les champs du formulaire terrain :
 * localisation (zone/axe/fil/niveau), intervention,
 * appareil utilisé, résultat et conditions météo.
 */
export interface Mission {
  id: string
  statut: StatutMission
  heureDebut: string | null
  heureFin:   string | null

  // ── Localisation ──────────────────────────────────────────────
  // Permet de situer précisément l'ouvrage sur le plan du stade
  zone:          ZoneGSC | null        // Tribune A/B/C/D
  axe:           string | null          // ex: "Axe D03/D05"
  fil:           string | null          // ex: "fil M/N"
  niveau:        string | null          // ex: "R+1", "SSL"
  partieOuvrage: string | null          // ex: "Crémaillère intermédiaire"

  // ── Intervention ──────────────────────────────────────────────
  // Décrit le travail topographique effectué
  nature:         NatureIntervention | null
  appareil:       AppareilMesure | null
  travailRealise: string | null          // description libre
  stadeCollage:   StadeCollage | null    // avancement de l'ouvrage

  // ── Résultat ──────────────────────────────────────────────────
  conditionMeteo: ConditionMeteo | null
  resultat:       ResultatControle | null  // C / NC / R
  observations:   string | null

  // ── Relations ─────────────────────────────────────────────────
  ficheId:   string
  ouvrageId: string
  ouvrage: {
    id: string
    reference: string
    designation: string
    type: TypeOuvrage
    axe: string | null
    niveau: string | null
  }
  controles: Controle[]
  _count: { controles: number }
}

export interface Fiche {
  id: string
  date: string
  statut: StatutFiche
  observations: string | null
  brigadeId: string
  createurId: string
  validateurId: string | null

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
  validateur?: {
    id: string
    nom: string
    prenom: string
  } | null

  missions: Mission[]
  _count: { missions: number }
}

export interface RapportStats {
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

// ─── RÉPONSES API ─────────────────────────────────────────────────────────────

export interface ApiError {
  success: false
  code: string
  message: string
  errors?: {
    field: string
    message: string
  }[]
}

export interface LoginResponse {
  success: true
  token: string
  user: User
}

export interface FichesResponse {
  success: true
  data: Fiche[]
  pagination: {
    total: number
    page: number
    limit: number
  }
  totalPages: number
}

export interface Pagination {
  total: number
  page: number
  limit: number
}

// ─── TYPES FORMULAIRE ─────────────────────────────────────────────────────────

/**
 * Données du formulaire de création/modification de mission.
 * Utilisé par react-hook-form dans MissionFormModal.
 *
 * DIFFÉRENCE AVEC Mission :
 * Mission = données retournées par l'API (id, statut, createdAt...)
 * MissionFormData = données saisies par l'utilisateur (sans id ni statut)
 */
export interface MissionFormData {
  ouvrageId: string

  // Localisation
  zone?:          ZoneGSC
  axe?:           string
  fil?:           string
  niveau?:        string
  partieOuvrage?: string

  // Intervention
  nature?:         NatureIntervention
  appareil?:       AppareilMesure
  travailRealise?: string
  stadeCollage?:   StadeCollage

  // Résultat
  conditionMeteo?: ConditionMeteo
  resultat?:       ResultatControle
  observations?:   string
}