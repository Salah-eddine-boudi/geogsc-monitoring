/**
 * @file mission.entity.ts
 * @description Entités domain pour les missions (= réceptions terrain).
 * NB: "mission" dans le code, "réception" à l'affichage.
 *
 * MODIFICATION v2 :
 * ✅ Tous les nouveaux champs CDC v2 ajoutés à MissionEntity
 *    (sousZone, provenanceAppareil, nomAppareil, periode, ecartMm,
 *     observationsNc, typeOuvrage, categorieAssainissement, ficheReference)
 */

export type StatutMission = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE'

// ─── Entité Mission (retour BDD sans relations) ───────────────────────────────
export interface MissionEntity {
  id:     string
  statut: StatutMission

  heureDebut: Date | null
  heureFin:   Date | null

  // ── §2 Localisation ───────────────────────────────────────────
  zone:          string | null
  sousZone:      string | null   // NEW v2 — sous-zone libre
  axe:           string | null
  fil:           string | null
  niveau:        string | null
  partieOuvrage: string | null

  // ── §3 Intervention ───────────────────────────────────────────
  nature:             string | null
  appareil:           string | null
  provenanceAppareil: string | null   // NEW v2 — GEOCODING | ENTREPRISE
  nomAppareil:        string | null   // NEW v2 — texte libre
  travailRealise:     string | null
  stadeCollage:       string | null
  periode:            string | null   // NEW v2 — JOUR | NUIT
  ecartMm:            number | null   // NEW v2 — écart mesuré (mm)

  // ── §4 Résultat ───────────────────────────────────────────────
  resultat:       string | null
  observationsNc: string | null       // NEW v2 — détail si NC
  observations:   string | null

  // ── Champs export Excel ───────────────────────────────────────
  typeOuvrage:             string | null   // NEW v2 (était optionnel avant)
  categorieAssainissement: string | null   // NEW v2
  ficheReference:          string | null   // NEW v2

  // ── Relations ─────────────────────────────────────────────────
  ficheId:   string
  ouvrageId: string

  // ── Audit ─────────────────────────────────────────────────────
  createdAt: Date
  updatedAt: Date
}

// ─── Mission avec ses relations (retour API) ──────────────────────────────────
export interface MissionWithRelations extends MissionEntity {
  ouvrage: {
    id:          string
    reference:   string
    designation: string
    type:        string
    axe:         string | null
    niveau:      string | null
  }
  controles: {
    id:            string
    type:          string
    statut:        string
    ecartX:        number | null
    ecartY:        number | null
    ecartZ:        number | null
    toleranceX:    number | null
    toleranceY:    number | null
    toleranceZ:    number | null
    observations:  string | null
    missionId:     string
    createdAt:     Date
  }[]
  _count: {
    controles: number
  }
}