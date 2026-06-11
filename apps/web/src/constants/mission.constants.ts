/**
 * @file mission.constants.ts
 * @description Constantes métier GSC — listes déroulantes du formulaire mission.
 *
 * Doit rester cohérent avec apps/api/src/constants/mission.constants.ts
 * (mêmes valeurs, utilisées pour la validation Zod backend).
 */

// ── ZONES DU STADE ────────────────────────────────────────────────

export const ZONES_GSC = [
  { value: 'A', label: 'Zone A — Tribune Nord' },
  { value: 'B', label: 'Zone B — Tribune Est' },
  { value: 'C', label: 'Zone C — Tribune Sud' },
  { value: 'D', label: 'Zone D — Tribune Ouest' },
  { value: 'HORS_ZONE', label: 'Hors zone' }
] as const

// ── CONDITIONS MÉTÉO ─────────────────────────────────────────────

export const CONDITIONS_METEO = [
  { value: 'BEAU', label: '☀️ Beau temps', icon: '☀️' },
  { value: 'NUAGEUX', label: '⛅ Nuageux', icon: '⛅' },
  { value: 'PLUIE', label: '🌧️ Pluie', icon: '🌧️' },
  { value: 'VENT_FORT', label: '💨 Vent fort', icon: '💨' },
  { value: 'BROUILLARD', label: '🌫️ Brouillard', icon: '🌫️' }
] as const

// ── NATURES D'INTERVENTION ────────────────────────────────────────

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

export const STADES_COLLAGE = [
  { value: 'AVANT_BETONNAGE', label: 'Avant bétonnage' },
  { value: 'APRES_BETONNAGE', label: 'Après bétonnage' },
  { value: 'AVANT_SOUDURE', label: 'Avant soudure' },
  { value: 'APRES_SOUDURE', label: 'Après soudure' },
  { value: 'RECEPTION_FINALE', label: 'Réception finale' }
] as const

// ── RÉSULTAT CONTRÔLE ─────────────────────────────────────────────

export const RESULTATS_CONTROLE = [
  { value: 'C', label: '✅ Conforme (C)' },
  { value: 'NC', label: '❌ Non conforme (NC)' },
  { value: 'R', label: '⚠️ Réserve (R)' }
] as const
