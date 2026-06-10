/**
 * @file controle.entity.ts
 * @description Entité Contrôle pure — mesure topographique sur un ouvrage.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONTEXTE MÉTIER GSC :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Le contrôle topographique consiste à mesurer les écarts
 * entre la position théorique (plans d'exécution) et la
 * position réelle de l'ouvrage sur le chantier.
 *
 * TYPES DE CONTRÔLES :
 * IMPLANTATION   → position X,Y de l'ouvrage
 * ALTIMETRIE     → position Z (altitude) de l'ouvrage
 * VERTICALITY    → verticalité des poteaux/voiles
 * RECEPTION      → réception finale de l'ouvrage
 * CONTRADICTOIRE → contrôle contradictoire avec l'entreprise
 *
 * ÉCARTS (en millimètres) :
 * ecartX → écart planimétrique axe X
 * ecartY → écart planimétrique axe Y
 * ecartZ → écart altimétrique
 *
 * TOLÉRANCES (en millimètres) :
 * Définies par les plans d'exécution et les DTU
 * Ex: platines charpente → ±5mm en X,Y / ±3mm en Z
 *
 * STATUT AUTOMATIQUE :
 * CONFORME     → |écart| ≤ tolérance sur tous les axes
 * NON_CONFORME → |écart| > tolérance sur au moins un axe
 * RESERVE      → cas limites, à surveiller
 */

export type ControleEntity = {
  id: string
  type: 'IMPLANTATION' | 'ALTIMETRIE' | 'VERTICALITY' | 'RECEPTION' | 'CONTRADICTOIRE'
  statut: 'CONFORME' | 'NON_CONFORME' | 'RESERVE'

  // Écarts mesurés en millimètres
  ecartX: number | null   // écart axe X (planimétrie)
  ecartY: number | null   // écart axe Y (planimétrie)
  ecartZ: number | null   // écart axe Z (altimétrie)

  // Tolérances en millimètres (depuis les plans d'exécution)
  toleranceX: number | null
  toleranceY: number | null
  toleranceZ: number | null

  observations: string | null
  missionId: string
  createdAt: Date
}