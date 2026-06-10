/**
 * @file rapport.service.ts
 * @description Service domaine — calcul des statistiques d'un rapport.
 *
 * Ce service calcule toutes les statistiques à partir
 * des données brutes (fiches, missions, contrôles).
 *
 * ALGORITHME :
 * 1. Filtre les fiches VALIDEES de la période et brigade
 * 2. Récupère toutes les missions de ces fiches
 * 3. Récupère tous les contrôles de ces missions
 * 4. Calcule les statistiques
 * 5. Identifie les ouvrages NON_CONFORMES
 */

import type { RapportStats } from '../entities/rapport.entity.js'

type FicheData = {
  id: string
  missions: {
    id: string
    ouvrageId: string
    ouvrage: {
      reference: string
      designation: string
    }
    controles: {
      statut: string
    }[]
  }[]
}

/**
 * Calcule le taux de conformité.
 *
 * FORMULE :
 * taux = (nbConformes / nbTotal) * 100
 * Arrondi à 1 décimale
 *
 * SCÉNARIO :
 * 198 CONFORMES / 234 total = 84.6%
 */
export function calculerTauxConformite(
  nbConformes: number,
  nbTotal: number
): number {
  if (nbTotal === 0) return 100
  return Math.round((nbConformes / nbTotal) * 1000) / 10
  // *1000/10 → arrondi à 1 décimale
}

/**
 * Calcule les statistiques complètes d'un rapport.
 *
 * @param fiches    - fiches validées de la période
 * @param brigadeId - ID de la brigade
 * @param periode   - format "2026-05"
 */
export function calculerStatsRapport(
  fiches: FicheData[],
  brigadeId: string,
  periode: string,
  brigadeInfo: { id: string; nom: string; chef: string }
): RapportStats {

  // Compte les missions
  const missions = fiches.flatMap(f => f.missions)
  const nbMissions = missions.length

  // Compte les contrôles par statut
  const controles = missions.flatMap(m => m.controles)
  const nbControles = controles.length
  const nbConformes = controles.filter(c => c.statut === 'CONFORME').length
  const nbReserves = controles.filter(c => c.statut === 'RESERVE').length
  const nbNonConformes = controles.filter(c => c.statut === 'NON_CONFORME').length

  // Taux de conformité
  const tauxConformite = calculerTauxConformite(nbConformes, nbControles)

  // Identifie les ouvrages NON_CONFORMES
  const ouvragesMap = new Map<string, {
    reference: string
    designation: string
    nbNonConformes: number
  }>()

  for (const mission of missions) {
    const nbNC = mission.controles.filter(c => c.statut === 'NON_CONFORME').length
    if (nbNC > 0) {
      const existing = ouvragesMap.get(mission.ouvrageId)
      if (existing) {
        existing.nbNonConformes += nbNC
      } else {
        ouvragesMap.set(mission.ouvrageId, {
          reference: mission.ouvrage.reference,
          designation: mission.ouvrage.designation,
          nbNonConformes: nbNC
        })
      }
    }
  }

  return {
    periode,
    brigade: brigadeInfo,
    nbFichesValidees: fiches.length,
    nbMissions,
    nbControles,
    nbConformes,
    nbReserves,
    nbNonConformes,
    tauxConformite,
    ouvragesNonConformes: Array.from(ouvragesMap.values())
      .sort((a, b) => b.nbNonConformes - a.nbNonConformes)
      // Trie par nombre de non-conformités décroissant
  }
}