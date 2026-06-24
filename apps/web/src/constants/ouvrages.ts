// ============================================================
// GeoGSC Monitoring — constants/ouvrages.ts
// Listes de référence du formulaire réception (mission)
// NB: "mission" dans le code, "réception" à l'affichage
// GEOCODING S.A.R.L. — Grand Stade de Casablanca
// ============================================================

// ─── Types d'ouvrages (document Word + Excel existant) ───────
// Ordre : Tribunes → Structures verticales → Charpente → Fondations → VRD → Autre
export const TYPES_OUVRAGE = [
  // Tribunes / Gradins
  { value: 'CREMAILLERE_INF',                    label: 'Crémaillère inférieure' },
  { value: 'CREMAILLERE_INT',                    label: 'Crémaillère intermédiaire' },
  { value: 'FIXATION_BOULONS_CREM_AV',           label: 'Fixation boulons crémaillères AV bétonnage' },
  { value: 'FIXATION_BOULONS_CREM_AP',           label: 'Fixation boulons crémaillères AP bétonnage' },
  { value: 'GRADIN',                             label: 'Gradin béton' },
  { value: 'SUPPORT_GRADIN',                     label: 'Support de gradin' },
  { value: 'CHAMBORD',                           label: 'Chambord' },
  { value: 'VOMITOIRE',                          label: 'Vomitoire' },
  { value: 'DALLE_AV',                           label: 'Dalle AV bétonnage' },
  { value: 'DALLE_AP',                           label: 'Dalle AP bétonnage' },
  // Structures verticales
  { value: 'POTEAU_AV',                          label: 'Poteau AV bétonnage' },
  { value: 'POTEAU_AP',                          label: 'Poteau AP bétonnage' },
  { value: 'VOILE_AV',                           label: 'Voile AV bétonnage' },
  { value: 'VOILE_AP',                           label: 'Voile AP bétonnage' },
  // Charpente métallique
  { value: 'PLATINE',                            label: 'Platine métallique' },
  // Fondations
  { value: 'SEMELLE_FILANTE',                    label: 'Semelle filante' },
  { value: 'SEMELLE_ISOLEE',                     label: 'Semelle isolée' },
  { value: 'MUR_SOUTENEMENT',                    label: 'Mur de soutènement' },
  // Pieux (colonnes Excel dédiées)
  { value: 'PIEUX_IMPLANTATION',                 label: 'Pieux — Implantation général' },
  { value: 'PIEUX_EXCENTREMENT_AV',              label: 'Pieux — Excentrement AV bétonnage' },
  { value: 'PIEUX_EXCENTREMENT_AP',              label: 'Pieux — Excentrement AP bétonnage' },
  // Terrassements
  { value: 'TERRASSEMENT',                       label: 'Terrassement / Plateforme' },
  // VRD / Assainissement (colonnes Excel dédiées)
  { value: 'ASSAINISSEMENT_FOND_FOUILLE',        label: 'Assainissement — Fond de fouille' },
  { value: 'ASSAINISSEMENT_FIL_EAU',             label: 'Assainissement — Fil d\'eau' },
  { value: 'ASSAINISSEMENT_LIT_POSE',            label: 'Assainissement — Lit de pose' },
  { value: 'ASSAINISSEMENT_COFFRAGE_VOILES',     label: 'Assainissement — Coffrage voiles regard' },
  { value: 'ASSAINISSEMENT_VOILE_AP',            label: 'Assainissement — Voile regard AP bétonnage' },
  { value: 'ASSAINISSEMENT_COFFRAGE_RADIER',     label: 'Assainissement — Coffrage radier' },
  { value: 'ASSAINISSEMENT_COTE_RADIER',         label: 'Assainissement — Cote radier' },
  { value: 'ASSAINISSEMENT_COFFRAGE_DALLE',      label: 'Assainissement — Coffrage dalle' },
  { value: 'ASSAINISSEMENT_DALLE_AP',            label: 'Assainissement — Dalle AP bétonnage' },
  { value: 'ASSAINISSEMENT_COFFRAGE_GROS_BETON', label: 'Assainissement — Coffrage gros béton' },
  { value: 'ASSAINISSEMENT_GROS_BETON_AP',       label: 'Assainissement — Gros béton AP bétonnage' },
  { value: 'ASSAINISSEMENT_IMPLANTATION',        label: 'Assainissement — Implantation général' },
  // Autre
  { value: 'AUTRE',                              label: 'Autre' },
] as const;

export type TypeOuvrageValue = typeof TYPES_OUVRAGE[number]['value'];

// ─── Catégories auto-déduites (pour Excel + rapport, pas affichées) ───
export const CATEGORIE_PAR_TYPE: Record<TypeOuvrageValue, string> = {
  CREMAILLERE_INF:                    'Tribunes',
  CREMAILLERE_INT:                    'Tribunes',
  FIXATION_BOULONS_CREM_AV:           'Tribunes',
  FIXATION_BOULONS_CREM_AP:           'Tribunes',
  GRADIN:                             'Tribunes',
  SUPPORT_GRADIN:                     'Tribunes',
  CHAMBORD:                           'Tribunes',
  VOMITOIRE:                          'Tribunes',
  DALLE_AV:                           'Tribunes',
  DALLE_AP:                           'Tribunes',
  POTEAU_AV:                          'Structures verticales',
  POTEAU_AP:                          'Structures verticales',
  VOILE_AV:                           'Structures verticales',
  VOILE_AP:                           'Structures verticales',
  PLATINE:                            'Charpente métallique',
  SEMELLE_FILANTE:                    'Gros-œuvre / Fondations',
  SEMELLE_ISOLEE:                     'Gros-œuvre / Fondations',
  MUR_SOUTENEMENT:                    'Gros-œuvre / Fondations',
  PIEUX_IMPLANTATION:                 'Pieux',
  PIEUX_EXCENTREMENT_AV:              'Pieux',
  PIEUX_EXCENTREMENT_AP:              'Pieux',
  TERRASSEMENT:                       'Terrassements',
  ASSAINISSEMENT_FOND_FOUILLE:        'VRD / Assainissement',
  ASSAINISSEMENT_FIL_EAU:            'VRD / Assainissement',
  ASSAINISSEMENT_LIT_POSE:           'VRD / Assainissement',
  ASSAINISSEMENT_COFFRAGE_VOILES:    'VRD / Assainissement',
  ASSAINISSEMENT_VOILE_AP:           'VRD / Assainissement',
  ASSAINISSEMENT_COFFRAGE_RADIER:    'VRD / Assainissement',
  ASSAINISSEMENT_COTE_RADIER:        'VRD / Assainissement',
  ASSAINISSEMENT_COFFRAGE_DALLE:     'VRD / Assainissement',
  ASSAINISSEMENT_DALLE_AP:           'VRD / Assainissement',
  ASSAINISSEMENT_COFFRAGE_GROS_BETON:'VRD / Assainissement',
  ASSAINISSEMENT_GROS_BETON_AP:      'VRD / Assainissement',
  ASSAINISSEMENT_IMPLANTATION:       'VRD / Assainissement',
  AUTRE:                             'Autre',
};

// ─── Zones du stade (A=Nord B=Sud C=Est D=Ouest) ─────────────
export const ZONES = [
  { value: 'A', label: 'A — Nord' },
  { value: 'B', label: 'B — Sud' },
  { value: 'C', label: 'C — Est' },
  { value: 'D', label: 'D — Ouest' },
] as const;

// ─── Niveaux (SSOL → R+7) ────────────────────────────────────
export const NIVEAUX = [
  { value: 'SSOL', label: 'Sous-sol (SSOL)' },
  { value: 'RDC',  label: 'RDC' },
  { value: 'MEZ',  label: 'Mezzanine (MEZ)' },
  { value: 'R1',   label: 'R+1' },
  { value: 'R2',   label: 'R+2' },
  { value: 'R3',   label: 'R+3' },
  { value: 'R4',   label: 'R+4' },
  { value: 'R5',   label: 'R+5' },
  { value: 'R6',   label: 'R+6' },
  { value: 'R7',   label: 'R+7' },
  { value: 'NA',   label: 'Non applicable' },
] as const;

// ─── Natures d'intervention ──────────────────────────────────
export const NATURES_INTERVENTION = [
  { value: 'IMPLANTATION',          label: 'Implantation' },
  { value: 'CTRL_IMPLANTATION',     label: 'Contrôle d\'implantation' },
  { value: 'CTRL_COFFRAGE',         label: 'Contrôle de coffrage' },
  { value: 'CTRL_VERTICALITE',      label: 'Contrôle de verticalité' },
  { value: 'CTRL_NIVELLEMENT',      label: 'Contrôle de nivellement' },
  { value: 'CTRL_PLANEITE',         label: 'Contrôle de planéité' },
  { value: 'RECEPTION_AV_BETON',    label: 'Réception avant bétonnage (PA)' },
  { value: 'RECEPTION_AP_BETON',    label: 'Réception après bétonnage' },
  { value: 'RECEPTION_AP_DECOFFR',  label: 'Réception après décoffrage' },
  { value: 'CTRL_FOND_FOUILLE',     label: 'Contrôle fond de fouille' },
  { value: 'CTRL_FIL_EAU',          label: 'Contrôle fil d\'eau' },
  { value: 'CTRL_COTE_RADIER',      label: 'Contrôle cote radier' },
  { value: 'LEVE_CONTRADICTOIRE',   label: 'Levé contradictoire' },
  { value: 'LEVE_AS_BUILT',         label: 'Levé As-Built / Récolement' },
  { value: 'CTRL_PENTE',            label: 'Contrôle de pente' },
  { value: 'AUTRE',                 label: 'Autre' },
] as const;

// ─── Stades collage / levée ──────────────────────────────────
export const STADES = [
  { value: 'NA',             label: 'N/A' },
  { value: 'COLLAGE_1',      label: '1er collage' },
  { value: 'COLLAGE_2',      label: '2ème collage' },
  { value: 'COLLAGE_3',      label: '3ème collage' },
  { value: 'LEVEE_1',        label: '1ère levée' },
  { value: 'LEVEE_2',        label: '2ème levée' },
  { value: 'LEVEE_3',        label: '3ème levée' },
  { value: 'LEVEE_FINALE',   label: 'Levée finale' },
] as const;

// ─── Période jour / nuit ─────────────────────────────────────
export const PERIODES = [
  { value: 'JOUR', label: 'Jour' },
  { value: 'NUIT', label: 'Nuit' },
] as const;