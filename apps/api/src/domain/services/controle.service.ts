/**
 * @file controle.service.ts
 * @description Service domaine — calcul automatique du statut d'un contrôle.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * POURQUOI UN SERVICE DOMAINE ?
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Le calcul du statut est une RÈGLE MÉTIER PURE.
 * Elle ne dépend d'aucune infrastructure (BDD, HTTP).
 * Elle appartient au domaine → service domaine.
 *
 * ALGORITHME :
 * Pour chaque axe fourni :
 *   Si |écart| > tolérance → NON_CONFORME
 *   Si |écart| > tolérance * 0.8 → RESERVE (proche de la limite)
 *   Sinon → CONFORME
 *
 * Si un seul axe est NON_CONFORME → contrôle NON_CONFORME
 * Si un seul axe est RESERVE → contrôle RESERVE
 * Sinon → CONFORME
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * EXEMPLE CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Platine charpente — tolérance ±5mm
 *   ecartX = +3mm → |3| ≤ 5 → CONFORME
 *   ecartY = -4mm → |4| ≤ 5 → CONFORME (mais proche limite)
 *   ecartZ = +8mm → |8| > 5 → NON_CONFORME ❌
 * → Statut global : NON_CONFORME
 */

type ControleData = {
  ecartX?: number | null
  ecartY?: number | null
  ecartZ?: number | null
  toleranceX?: number | null
  toleranceY?: number | null
  toleranceZ?: number | null
}

type StatutControle = 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

/**
 * Calcule le statut d'un axe individuel.
 *
 * @param ecart     - écart mesuré en mm
 * @param tolerance - tolérance admise en mm
 * @returns statut de cet axe
 */
function calculerStatutAxe(
  ecart: number,
  tolerance: number
): StatutControle {
  const ecartAbsolu = Math.abs(ecart)
  // Math.abs() → valeur absolue (+3 ou -3 → 3)

  if (ecartAbsolu > tolerance) {
    // Hors tolérance → action corrective requise
    return 'NON_CONFORME'
  }

  if (ecartAbsolu > tolerance * 0.8) {
    // Dans la tolérance mais proche de la limite (80%)
    // Réserve → à surveiller lors du prochain contrôle
    return 'RESERVE'
  }

  return 'CONFORME'
}

/**
 * Calcule le statut global d'un contrôle topographique.
 *
 * RÈGLE DE PRIORITÉ :
 * NON_CONFORME > RESERVE > CONFORME
 * Si un axe est NON_CONFORME → tout le contrôle est NON_CONFORME
 * Si un axe est RESERVE → tout le contrôle est RESERVE
 *
 * @param data - écarts et tolérances du contrôle
 * @returns statut global calculé automatiquement
 */
export function calculerStatutControle(data: ControleData): StatutControle {
  const statuts: StatutControle[] = []

  // Vérifie chaque axe si les deux valeurs sont fournies
  if (data.ecartX != null && data.toleranceX != null) {
    statuts.push(calculerStatutAxe(data.ecartX, data.toleranceX))
  }

  if (data.ecartY != null && data.toleranceY != null) {
    statuts.push(calculerStatutAxe(data.ecartY, data.toleranceY))
  }

  if (data.ecartZ != null && data.toleranceZ != null) {
    statuts.push(calculerStatutAxe(data.ecartZ, data.toleranceZ))
  }

  // Si aucun axe calculable → statut manuel requis
  if (statuts.length === 0) return 'CONFORME'

  // Règle de priorité : le pire statut gagne
  if (statuts.includes('NON_CONFORME')) return 'NON_CONFORME'
  if (statuts.includes('RESERVE')) return 'RESERVE'
  return 'CONFORME'
}