/**
 * @file api.types.ts
 * @description Types TypeScript partagés — forme exacte des données de l'API.
 *
 * POURQUOI CE FICHIER ?
 * ─────────────────────
 * TypeScript est un langage typé. Sans types, on ne sait pas
 * ce que l'API retourne exactement → bugs silencieux.
 *
 * AVEC ce fichier, si l'API retourne { fiche: { id: string } }
 * et qu'on essaie d'accéder à fiche.nom qui n'existe pas →
 * TypeScript nous avertit AVANT l'exécution.
 *
 * RÈGLE :
 * Ces types doivent correspondre exactement aux réponses du backend.
 * Si le backend change, on met à jour ici → erreurs TypeScript
 * partout où le type a changé → on corrige tout d'un coup.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────
// Un type union en TypeScript = liste de valeurs possibles
// Avantage : si on écrit 'BROUILLON2' par erreur → erreur TypeScript

/** Rôles possibles d'un utilisateur dans l'application */
export type Role = 'BRIGADE' | 'IGT' | 'ADMIN'

/**
 * Statuts d'une fiche journalière — machine à états :
 * BROUILLON → SOUMISE → VALIDEE
 *                     ↘ REJETEE → SOUMISE
 */
export type StatutFiche = 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'

/**
 * Statuts d'une mission topographique :
 * PLANIFIEE → EN_COURS → TERMINEE
 */
export type StatutMission = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'

/**
 * Statuts d'un contrôle — calculés automatiquement par le backend
 * selon les écarts et tolérances mesurés
 */
export type StatutControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

/** Types de contrôles topographiques effectués sur le chantier GSC */
export type TypeControle =
  | 'IMPLANTATION'    // position X,Y de l'ouvrage
  | 'ALTIMETRIE'      // position Z (altitude)
  | 'VERTICALITY'     // verticalité des poteaux/voiles
  | 'RECEPTION'       // réception finale
  | 'CONTRADICTOIRE'  // contrôle contradictoire avec l'entreprise

/** Types d'ouvrages du Grand Stade de Casablanca */
export type TypeOuvrage =
  | 'PLATINE'     // platines de charpente métallique
  | 'POTEAU'      // poteaux béton
  | 'VOILE'       // voiles béton
  | 'GRADIN'      // gradins tribune
  | 'FONDATION'   // fondations profondes (pieux)
  | 'VRD'         // voirie et réseaux divers
  | 'AUTRE'

// ─── ENTITÉS ──────────────────────────────────────────────────────────────────
// Une interface TypeScript décrit la forme exacte d'un objet.
// Le ? après le nom d'un champ signifie qu'il est optionnel.

/**
 * Utilisateur connecté.
 * Retourné par POST /auth/login et GET /auth/me
 */
export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  brigadeId?: string  // présent seulement si role === 'BRIGADE'
}

/**
 * Brigade topographique.
 * Retourné par GET /brigades
 */
export interface Brigade {
  id: string
  nom: string       // ex: "Équipe 01"
  chef: string      // ex: "M. AIT KADIR"
  actif: boolean
  createdAt: string // date ISO 8601
}

/**
 * Ouvrage de construction GSC.
 * Référentiel des éléments contrôlés topographiquement.
 * Retourné par GET /ouvrages
 */
export interface Ouvrage {
  id: string
  reference: string    // ex: "PLT-A-01" — identifiant unique sur le terrain
  designation: string  // ex: "Platine charpente axe A-01"
  type: TypeOuvrage
  axe: string | null   // ex: "Axe A" — null si non applicable
  niveau: string | null // ex: "R+1" — null si non applicable
  actif: boolean
}

/**
 * Contrôle topographique — mesure d'écart sur un ouvrage.
 * Le statut est calculé AUTOMATIQUEMENT par le backend.
 * Jamais envoyé par le frontend.
 *
 * Retourné dans les missions via GET /fiches/:id
 */
export interface Controle {
  id: string
  type: TypeControle
  statut: StatutControle  // calculé auto : CONFORME/RESERVE/NON_CONFORME

  // Écarts mesurés en millimètres (null si non mesuré)
  ecartX: number | null
  ecartY: number | null
  ecartZ: number | null

  // Tolérances admises en millimètres (depuis les plans d'exécution)
  toleranceX: number | null
  toleranceY: number | null
  toleranceZ: number | null

  observations: string | null
  missionId: string
  createdAt: string
}

/**
 * Mission topographique — intervention sur un ouvrage dans une journée.
 * Appartient à une fiche journalière.
 *
 * Retourné dans les fiches via GET /fiches/:id
 */
export interface Mission {
  id: string
  statut: StatutMission
  heureDebut: string | null  // ISO 8601, null si pas encore démarrée
  heureFin: string | null    // ISO 8601, null si pas encore terminée
  observations: string | null
  ficheId: string
  ouvrageId: string

  // Relation ouvrage — incluse dans la réponse API
  ouvrage: {
    id: string
    reference: string
    designation: string
    type: TypeOuvrage
    axe: string | null
    niveau: string | null
  }

  // Contrôles effectués dans cette mission
  controles: Controle[]

  // Compteur — plus efficace que controles.length
  _count: { controles: number }
}

/**
 * Fiche journalière — document central du contrôle GSC.
 * Créée par une brigade, validée par l'IGT.
 *
 * Retourné par GET /fiches/:id
 */
export interface Fiche {
  id: string
  date: string           // ISO 8601
  statut: StatutFiche
  observations: string | null
  brigadeId: string
  createurId: string
  validateurId: string | null  // null si pas encore validée

  // Relations incluses dans la réponse API
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

  // Compteur rapide sans charger toutes les missions
  _count: { missions: number }
}

/**
 * Statistiques d'un rapport mensuel.
 * Calculées côté serveur à la demande.
 *
 * Retourné par GET /rapports/:brigadeId/:periode
 */
export interface RapportStats {
  periode: string  // format "YYYY-MM" ex: "2026-05"
  brigade: {
    id: string
    nom: string
    chef: string
  }

  // Statistiques calculées
  nbFichesValidees: number
  nbMissions: number
  nbControles: number
  nbConformes: number
  nbReserves: number
  nbNonConformes: number
  tauxConformite: number  // pourcentage 0-100, arrondi 1 décimale

  // Ouvrages avec des non-conformités — triés par nb décroissant
  ouvragesNonConformes: {
    reference: string
    designation: string
    nbNonConformes: number
  }[]
}

// ─── RÉPONSES API ─────────────────────────────────────────────────────────────
// Ces interfaces décrivent la forme exacte du JSON retourné par le backend.
// Le champ success: true/false est toujours présent.

/**
 * Réponse d'erreur standard de l'API.
 * Retournée quand success: false
 */
export interface ApiError {
  success: false
  code: string      // ex: 'NOT_FOUND', 'VALIDATION_ERROR', 'UNAUTHORIZED'
  message: string   // message lisible par l'humain
  errors?: {        // détails des erreurs de validation (optionnel)
    field: string
    message: string
  }[]
}

/**
 * Réponse de POST /auth/login
 */
export interface LoginResponse {
  success: true
  token: string   // JWT à stocker dans localStorage
  user: User
}

/**
 * Réponse de GET /fiches
 * Liste paginée des fiches journalières
 */
export interface FichesResponse {
  success: true
  data: Fiche[]
  pagination: {
    total: number   // nombre total de fiches (toutes pages confondues)
    page: number    // page courante (commence à 1)
    limit: number   // nombre de fiches par page
  }
  totalPages: number
}

/**
 * Informations de pagination — réutilisées dans plusieurs réponses
 */
export interface Pagination {
  total: number
  page: number
  limit: number
}