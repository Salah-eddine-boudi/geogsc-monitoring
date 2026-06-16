/**
 * @file ouvrage.entity.ts
 * @description Entité Ouvrage pure.
 *
 * UN OUVRAGE = élément de construction contrôlé topographiquement.
 *
 * TYPES D'OUVRAGES GSC :
 * PLATINE    → platines de charpente métallique
 * POTEAU     → poteaux béton
 * VOILE      → voiles béton
 * GRADIN     → gradins tribune
 * FONDATION  → fondations profondes (pieux)
 * VRD        → voirie et réseaux divers
 * AUTRE      → autres éléments
 */

export type OuvrageEntity = {
  id: string
  reference: string    // unique — ex: "PLT-A-01"
  designation: string  // ex: "Platine charpente axe A-01"
  type: string         // enum TypeOuvrage
  axe: string | null
  niveau: string | null
  actif: boolean
  createdAt: Date
}