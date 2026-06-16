/**
 * @file mission.constants.ts
 * @description Constantes métier GSC — listes déroulantes du formulaire mission.
 *
 * POURQUOI CE FICHIER ?
 * ─────────────────────
 * Ces listes doivent être cohérentes entre :
 * → Le formulaire frontend (affichage)
 * → La validation Zod backend (contrôle)
 * → Le fichier Excel exporté (colonnes)
 *
 * SI UNE LISTE CHANGE (ex: nouvel appareil acheté)
 * → on modifie CE fichier uniquement
 * → tout le reste se met à jour automatiquement
 *
 * PATTERN : Single Source of Truth (SSOT)
 */

// ── ZONES DU STADE ────────────────────────────────────────────────

/**
 * Le Grand Stade de Casablanca est divisé en 4 zones.
 * Chaque zone correspond à une tribune.
 */
export const ZONES_GSC = [
  { value: 'A', label: 'Zone A — Tribune Nord' },
  { value: 'B', label: 'Zone B — Tribune Est' },
  { value: 'C', label: 'Zone C — Tribune Sud' },
  { value: 'D', label: 'Zone D — Tribune Ouest' },
  { value: 'HORS_ZONE', label: 'Hors zone' }
] as const

// ── CONDITIONS MÉTÉO ─────────────────────────────────────────────

/**
 * Conditions météo au moment de l'intervention.
 * Impacte la qualité des mesures topographiques.
 * Ex: brouillard → précision réduite du tachéomètre.
 */
export const CONDITIONS_METEO = [
  { value: 'BEAU', label: '☀️ Beau temps', icon: '☀️' },
  { value: 'NUAGEUX', label: '⛅ Nuageux', icon: '⛅' },
  { value: 'PLUIE', label: '🌧️ Pluie', icon: '🌧️' },
  { value: 'VENT_FORT', label: '💨 Vent fort', icon: '💨' },
  { value: 'BROUILLARD', label: '🌫️ Brouillard', icon: '🌫️' }
] as const

// ── NATURES D'INTERVENTION ────────────────────────────────────────

/**
 * Type de travail topographique effectué.
 * Détermine les champs obligatoires dans le formulaire.
 * Ex: IMPLANTATION → écarts X/Y obligatoires
 *     ALTIMETRIE   → écart Z obligatoire
 */
export const NATURES_INTERVENTION = [
  { value: 'IMPLANTATION', label: 'Implantation' },
  { value: 'CONTROLE_GEOMETRIQUE', label: 'Contrôle géométrique' },
  { value: 'CONTROLE_ALTIMETRIQUE', label: 'Contrôle altimétrique' },
  { value: 'RECEPTION', label: 'Réception' },
  { value: 'CONTRADICTOIRE', label: 'Contradictoire' },
  { value: 'RELEVE_TOPOGRAPHIQUE', label: 'Relevé topographique' },
  { value: 'PIQUETAGE', label: 'Piquetage' }
] as const

// ── APPAREILS DE MESURE ───────────────────────────────────────────

/**
 * Instruments topographiques disponibles sur le chantier GSC.
 * Chaque appareil a sa propre précision et usage.
 *
 * Trimble SX12 → tachéomètre scanning haute précision
 * Leica NA730  → niveau optique pour altimétrie
 * GPS Trimble  → positionnement global
 */
export const APPAREILS_MESURE = [
  { value: 'TRIMBLE_SX12', label: 'Trimble SX12 (Tachéomètre)' },
  { value: 'TRIMBLE_S7', label: 'Trimble S7' },
  { value: 'LEICA_TS16', label: 'Leica TS16' },
  { value: 'LEICA_NA730', label: 'Leica NA730 (Niveau)' },
  { value: 'GPS_TRIMBLE', label: 'GPS Trimble R10' },
  { value: 'NIVEAU_OPTIQUE', label: 'Niveau optique' },
  { value: 'AUTRE', label: 'Autre appareil' }
] as const

// ── STADES DE COLLAGE ─────────────────────────────────────────────

/**
 * Stade d'avancement de l'ouvrage au moment du contrôle.
 * AV = avant, AP = après
 * Détermine la nature des tolérances applicables.
 */
export const STADES_COLLAGE = [
  { value: 'AVANT_BETONNAGE', label: 'Avant bétonnage' },
  { value: 'APRES_BETONNAGE', label: 'Après bétonnage' },
  { value: 'AVANT_SOUDURE', label: 'Avant soudure' },
  { value: 'APRES_SOUDURE', label: 'Après soudure' },
  { value: 'RECEPTION_FINALE', label: 'Réception finale' }
] as const

// ── TYPES D'OUVRAGES ──────────────────────────────────────────────

/**
 * Types d'ouvrages GSC — correspond aux colonnes du fichier Excel.
 * Utilisé pour la sélection dans le formulaire ET l'export Excel.
 */
export const TYPES_OUVRAGES_OPTIONS = [
  { value: 'PLATINE', label: 'Platine charpente' },
  { value: 'POTEAU', label: 'Poteau béton' },
  { value: 'VOILE', label: 'Voile béton' },
  { value: 'GRADIN', label: 'Gradin tribune' },
  { value: 'FONDATION', label: 'Fondation / Semelle' },
  { value: 'VRD', label: 'VRD / Terrassement' },
  { value: 'AUTRE', label: 'Autre ouvrage' }
] as const

// ── RÉSULTAT CONTRÔLE ─────────────────────────────────────────────

export const RESULTATS_CONTROLE = [
  { value: 'C', label: '✅ Conforme (C)' },
  { value: 'NC', label: '❌ Non conforme (NC)' },
  { value: 'R', label: '⚠️ Réserve (R)' }
] as const