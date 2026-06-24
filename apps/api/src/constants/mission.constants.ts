/**
 * @file mission.constants.ts
 * @description Constantes du formulaire mission (affiché "Réception").
 * NB: noms internes conservés (GEOCODING, ENTREPRISE...) pour
 *     compatibilité avec les données historiques et le backend existant.
 *
 * MODIFICATIONS v2 :
 * ✅ Zones avec orientation réelle (Nord/Sud/Est/Ouest)
 * ✅ PROVENANCES_APPAREIL renommé (Interne/Externe) — labels mis à jour
 * ✅ TYPES_OUVRAGE alignés sur l'Excel existant (exporter-rapport-excel.use-case.ts)
 * ✅ STADES_COLLAGE : valeurs historiques conservées + nouvelles valeurs
 * ✅ NIVEAUX_ETAGE R+1 → R+7 (cas poteaux hauts)
 * ✅ PERIODES_TRAVAIL ajouté (Jour/Nuit)
 */

// ─── ZONES DU STADE ───────────────────────────────────────────────────────────
// A=Nord, B=Sud, C=Est, D=Ouest — confirmé lors de la visite terrain
export const ZONES_GSC = [
  { value: 'A', label: 'Zone A — Tribune Nord' },
  { value: 'B', label: 'Zone B — Tribune Sud' },
  { value: 'C', label: 'Zone C — Tribune Est' },
  { value: 'D', label: 'Zone D — Tribune Ouest' },
] as const

// ─── MÉTÉO (portée par la fiche, pas la mission) ──────────────────────────────
export const CONDITIONS_METEO = [
  { value: 'BEAU',       label: '☀️ Beau temps'  },
  { value: 'NUAGEUX',    label: '⛅ Nuageux'      },
  { value: 'PLUIE',      label: '🌧️ Pluie'        },
  { value: 'VENT_FORT',  label: '💨 Vent fort'    },
  { value: 'BROUILLARD', label: '🌫️ Brouillard'   },
] as const

// ─── NATURES D'INTERVENTION ───────────────────────────────────────────────────
// Valeurs historiques conservées pour la rétrocompatibilité
export const NATURES_INTERVENTION = [
  // ── Nouvelles valeurs (CDC v2) ──
  { value: 'IMPLANTATION',               label: 'Implantation' },
  { value: 'CONTROLE_IMPLANTATION',      label: "Contrôle d'implantation" },
  { value: 'CONTROLE_COFFRAGE',          label: 'Contrôle de coffrage' },
  { value: 'CONTROLE_VERTICALITE',       label: 'Contrôle de verticalité' },
  { value: 'CONTROLE_NIVELLEMENT',       label: 'Contrôle de nivellement' },
  { value: 'CONTROLE_PLANEITE',          label: 'Contrôle de planéité' },
  { value: 'RECEPTION_AVANT_BETONNAGE',  label: 'Réception avant bétonnage (PA)' },
  { value: 'RECEPTION_APRES_BETONNAGE',  label: 'Réception après bétonnage' },
  { value: 'RECEPTION_APRES_DECOFFRAGE', label: 'Réception après décoffrage' },
  { value: 'CONTROLE_FOND_FOUILLE',      label: 'Contrôle fond de fouille' },
  { value: 'CONTROLE_FIL_EAU',           label: "Contrôle fil d'eau" },
  { value: 'CONTROLE_COTE_RADIER',       label: 'Contrôle cote radier' },
  { value: 'LEVE_CONTRADICTOIRE',        label: 'Levé contradictoire' },
  { value: 'LEVE_AS_BUILT',              label: 'Levé As-Built / Récolement' },
  { value: 'CONTROLE_PENTE',             label: 'Contrôle de pente' },
  { value: 'AUTRE',                      label: 'Autre' },
  // ── Valeurs historiques (données avant CDC v2) ──
  { value: 'CONTROLE_GEOMETRIQUE',       label: 'Contrôle géométrique (ancien)' },
  { value: 'CONTROLE_ALTIMETRIQUE',      label: 'Contrôle altimétrique (ancien)' },
  { value: 'RECEPTION',                  label: 'Réception (ancien)' },
  { value: 'CONTRADICTOIRE',             label: 'Contradictoire (ancien)' },
  { value: 'RELEVE_TOPOGRAPHIQUE',       label: 'Relevé topographique (ancien)' },
  { value: 'PIQUETAGE',                  label: 'Piquetage (ancien)' },
] as const

// ─── APPAREILS DE MESURE ──────────────────────────────────────────────────────
// Conservé pour rétrocompatibilité (données historiques ont ces valeurs).
// Le formulaire affiche désormais un toggle Interne/Externe + nom libre,
// mais la constante reste pour les fiches déjà enregistrées.
export const APPAREILS_MESURE = [
  { value: 'TRIMBLE_SX12',   label: 'Station totale (Trimble SX12)' },
  { value: 'TRIMBLE_S7',     label: 'Station totale (Trimble S7)' },
  { value: 'LEICA_TS16',     label: 'Station totale (Leica TS16)' },
  { value: 'LEICA_NA730',    label: 'Niveau digital (Leica NA730)' },
  { value: 'GPS_TRIMBLE',    label: 'Récepteur GNSS (Trimble R10)' },
  { value: 'NIVEAU_OPTIQUE', label: 'Niveau optique' },
  { value: 'AUTRE',          label: 'Autre appareil' },
] as const

// ─── PROVENANCE APPAREIL ──────────────────────────────────────────────────────
// Labels mis à jour : Interne / Externe (plus clair sur le terrain)
// Valeurs BDD conservées : GEOCODING / ENTREPRISE (rétrocompatibilité)
export const PROVENANCES_APPAREIL = [
  { value: 'GEOCODING',  label: '🏗️ Interne (GEOCODING)' },
  { value: 'ENTREPRISE', label: '🔧 Externe (Entreprise)' },
] as const

// ─── STADES COLLAGE / LEVÉE ───────────────────────────────────────────────────
export const STADES_COLLAGE = [
  { value: 'NA',                label: 'N/A' },
  { value: 'PREMIER_COLLAGE',   label: '1er collage' },
  { value: 'DEUXIEME_COLLAGE',  label: '2ème collage' },
  { value: 'TROISIEME_COLLAGE', label: '3ème collage' },
  { value: 'PREMIERE_LEVEE',    label: '1ère levée' },
  { value: 'DEUXIEME_LEVEE',    label: '2ème levée' },
  { value: 'TROISIEME_LEVEE',   label: '3ème levée' },
  { value: 'LEVEE_FINALE',      label: 'Levée finale' },
  // Historiques
  { value: 'AVANT_BETONNAGE',   label: 'Avant bétonnage (ancien)' },
  { value: 'APRES_BETONNAGE',   label: 'Après bétonnage (ancien)' },
  { value: 'AVANT_SOUDURE',     label: 'Avant soudure (ancien)' },
  { value: 'APRES_SOUDURE',     label: 'Après soudure (ancien)' },
  { value: 'RECEPTION_FINALE',  label: 'Réception finale (ancien)' },
] as const

// ─── TYPES D'OUVRAGE ──────────────────────────────────────────────────────────
// Alignés avec exporter-rapport-excel.use-case.ts (colonnes Excel existantes)
export const TYPES_OUVRAGE = [
  // ── STRUCTURE & GÉNÉRAL ──
  { value: 'POTEAU_AV_BETONNAGE',                        label: 'Poteau AV bétonnage' },
  { value: 'POTEAU_AP_BETONNAGE',                        label: 'Poteau AP bétonnage' },
  { value: 'POUTRE_CREMAILLERE_AV_BETONNAGE',            label: 'Poutre crémaillère AV bétonnage' },
  { value: 'POUTRE_CREMAILLERE_AP_BETONNAGE',            label: 'Poutre crémaillère AP bétonnage' },
  { value: 'FIXATION_BOULONS_CREMAILLERES_AV_BETONNAGE', label: 'Fixation boulons AV bétonnage' },
  { value: 'FIXATION_BOULONS_CREMAILLERES_AP_BETONNAGE', label: 'Fixation boulons AP bétonnage' },
  { value: 'GRADIN',                                     label: 'Gradins' },
  { value: 'SUPPORT_GRADIN',                             label: 'Support de gradin' },
  { value: 'VOILE_AV_BETONNAGE',                         label: 'Voile AV bétonnage' },
  { value: 'VOILE_AP_BETONNAGE',                         label: 'Voile AP bétonnage' },
  { value: 'CHAMBORD',                                   label: 'Chambord' },
  { value: 'VOMITOIRE',                                  label: 'Vomitoire' },
  { value: 'SEMELLE_FILANTE',                            label: 'Semelle filante' },
  { value: 'SEMELLE_ISOLEE',                             label: 'Semelle isolée' },
  { value: 'DALLES_AV_BETONNAGE',                        label: 'Dalles AV bétonnage' },
  { value: 'DALLES_AP_BETONNAGE',                        label: 'Dalles AP bétonnage' },
  { value: 'MUR_SOUTENEMENT',                            label: 'Mur de soutènement' },
  { value: 'TERRASSEMENT',                               label: 'Terrassement / Plateforme' },
  { value: 'PLATINE',                                    label: 'Platine charpente' },
  { value: 'FONDATION',                                  label: 'Fondation' },
  { value: 'VRD',                                        label: 'VRD / Voirie' },

  // ── PIEUX (3 Options) ──
  { value: 'PIEUX_IMPLANTATION',                         label: 'Pieux — Implantation générale' },
  { value: 'PIEUX_EXCENTREMENT_AV',                      label: 'Pieux — Excentrement AV bétonnage' },
  { value: 'PIEUX_EXCENTREMENT_AP',                      label: 'Pieux — Excentrement AP bétonnage' },

  // ── ASSAINISSEMENT (12 Options) ──
  { value: 'ASS_FOND_FOUILLE',                           label: 'Assainissement — Fond de fouille' },
  { value: 'ASS_FIL_EAU',                                label: "Assainissement — Fil d'eau" },
  { value: 'ASS_LIT_POSE',                               label: 'Assainissement — Lit de pose' },
  { value: 'ASS_COFFRAGE_VOILES_REGARD',                 label: 'Assainissement — Coffrage voiles du regard' },
  { value: 'ASS_VOILE_REGARD_AP_BETONNAGE',              label: 'Assainissement — Voile du regard AP bétonnage' },
  { value: 'ASS_COFFRAGE_RADIER',                        label: 'Assainissement — Coffrage RADIER' },
  { value: 'ASS_COTE_RADIER',                            label: 'Assainissement — COTE RADIER' },
  { value: 'ASS_COFFRAGE_DALLE',                         label: 'Assainissement — Coffrage dalle' },
  { value: 'ASS_DALL_AP_BETONNAGE',                      label: 'Assainissement — Dalle AP bétonnage' },
  { value: 'ASS_COFFRAGE_GROS_BETON',                    label: 'Assainissement — Coffrage gros béton' },
  { value: 'ASS_GROS_BETON_AP_BETONNAGE',                label: 'Assainissement — Gros béton AP bétonnage' },
  { value: 'ASS_IMPLANTATION_GENERAL',                   label: 'Assainissement — Implantation générale' },

  { value: 'AUTRE',                                      label: 'Autre' }
] as const

// ─── CATÉGORIES ASSAINISSEMENT ────────────────────────────────────────────────
// Alignées avec les colonnes Excel (exporter-rapport-excel.use-case.ts)
export const CATEGORIES_ASSAINISSEMENT = [
  { value: 'FOND_DE_FOUILLE',           label: 'Fond de fouille' },
  { value: 'FIL_EAU',                   label: "Fil d'eau" },
  { value: 'LIT_POSE',                  label: 'Lit de pose' },
  { value: 'COFFRAGE_VOILES_REGARD',    label: 'Coffrage voiles du regard' },
  { value: 'VOILE_REGARD_AP_BETONNAGE', label: 'Voile du regard AP bétonnage' },
  { value: 'COFFRAGE_RADIER',           label: 'Coffrage RADIER' },
  { value: 'COTE_RADIER',               label: 'COTE RADIER' },
  { value: 'COFFRAGE_DALLE',            label: 'Coffrage dalle' },
  { value: 'DALL_AP_BETONNAGE',         label: 'Dalle AP bétonnage' },
  { value: 'COFFRAGE_GROS_BETON',       label: 'Coffrage gros béton' },
  { value: 'GROS_BETON_AP_BETONNAGE',   label: 'Gros béton AP bétonnage' },
  { value: 'IMPLANTATION_GENERAL',      label: 'Implantation général' },
  { value: 'AUTRE',                     label: 'Autre' },
] as const

// ─── NIVEAUX / ÉTAGES ─────────────────────────────────────────────────────────
// R+7 max — cas poteaux hauts GSC
export const NIVEAUX_ETAGE = [
  { value: 'SSOL', label: 'Sous-sol (SSOL)' },
  { value: 'RDC',  label: 'RDC' },
  { value: 'MEZ',  label: 'Mezzanine (MEZ)' },
  { value: 'R+1',  label: 'R+1' },
  { value: 'R+2',  label: 'R+2' },
  { value: 'R+3',  label: 'R+3' },
  { value: 'R+4',  label: 'R+4' },
  { value: 'R+5',  label: 'R+5' },
  { value: 'R+6',  label: 'R+6' },
  { value: 'R+7',  label: 'R+7' },
] as const

// ─── RÉSULTATS DU CONTRÔLE ────────────────────────────────────────────────────
export const RESULTATS_CONTROLE = [
  { value: 'CONFORME',     label: 'Conforme',      short: 'C'  },
  { value: 'NON_CONFORME', label: 'Non conforme',  short: 'NC' },
  { value: 'RESERVE',      label: 'Réserve',       short: 'R'  },
] as const

// ─── PÉRIODES DE TRAVAIL ──────────────────────────────────────────────────────
// Chantier 24h/24 — Jour ou Nuit par réception
export const PERIODES_TRAVAIL = [
  { value: 'JOUR', label: '☀️ Jour' },
  { value: 'NUIT', label: '🌙 Nuit' },
] as const

// ─── Alias rétrocompatibilité ─────────────────────────────────────────────────
export const TYPES_OUVRAGES_OPTIONS = TYPES_OUVRAGE





// Ajouter/remplacer dans mission.constants.ts

// ─── AXES PAR ZONE ────────────────────────────────────────────────────────────
// Axes filtrés selon la zone sélectionnée : A1-A25, B1-B25, C1-C25, D1-D25
export const AXES_PAR_ZONE: Record<string, { value: string; label: string }[]> = {
  A: Array.from({ length: 25 }, (_, i) => ({ value: `A${i + 1}`, label: `A${i + 1}` })),
  B: Array.from({ length: 25 }, (_, i) => ({ value: `B${i + 1}`, label: `B${i + 1}` })),
  C: Array.from({ length: 25 }, (_, i) => ({ value: `C${i + 1}`, label: `C${i + 1}` })),
  D: Array.from({ length: 25 }, (_, i) => ({ value: `D${i + 1}`, label: `D${i + 1}` })),
}

// Tous les axes sans filtrage (si aucune zone sélectionnée)
export const TOUS_LES_AXES = [
  ...AXES_PAR_ZONE.A,
  ...AXES_PAR_ZONE.B,
  ...AXES_PAR_ZONE.C,
  ...AXES_PAR_ZONE.D,
]

// ─── FILS ─────────────────────────────────────────────────────────────────────
// Fils de A à M (13 valeurs)
export const FILS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'H', label: 'H' },
  { value: 'I', label: 'I' },
  { value: 'J', label: 'J' },
  { value: 'K', label: 'K' },
  { value: 'L', label: 'L' },
  { value: 'M', label: 'M' },
] as const

// Garder CONDITIONS_METEO existant — il est déjà dans le fichier
// Supprimer PERIODES_TRAVAIL — plus utilisé


// ─── DICTIONNAIRE DES TOLÉRANCES (en mm) ───
// Valeurs à ajuster selon ton vrai Cahier des Charges (CDC)
export const TOLERANCES_OUVRAGES: Record<string, number> = {
  'POTEAU_AV_BETONNAGE': 10, // ex: Tolérance de 10mm max
  'POTEAU_AP_BETONNAGE': 15,
  'VOILE_AV_BETONNAGE':  10,
  'GRADIN':              5,
  // Ajoute les autres ici...
}