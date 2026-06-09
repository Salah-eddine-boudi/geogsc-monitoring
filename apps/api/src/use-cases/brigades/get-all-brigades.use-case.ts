/**
 * @file get-all-brigades.use-case.ts
 * @description Use-case : récupérer toutes les brigades.
 *
 * QUI PEUT APPELER CE USE-CASE ?
 * - IGT Hakim → voit toutes les brigades actives sur le dashboard
 * - ADMIN     → voit toutes les brigades (actives + inactives)
 * - BRIGADE   → voit seulement SA brigade (filtré dans la route)
 *
 * SCÉNARIO CONCRET :
 * IGT ouvre l'app → dashboard affiche :
 *   ✅ Équipe 01 — AIT KADIR    — 3 membres
 *   ✅ Équipe 02 — TAKI         — 2 membres
 *   ✅ Équipe 03 — JEMI         — 3 membres
 *   ⛔ Équipe 04 — ALLAOUI      — suspendue
 */

import type { IBrigadeRepository } from '../../domain/brigade.repository.js'
import type { BrigadeEntity } from '../../domain/entities/brigade.entity.js'

/**
 * Paramètres du use-case.
 *
 * @property role            - rôle de l'utilisateur connecté
 *                             ADMIN → voit tout
 *                             IGT/BRIGADE → voit seulement les actives
 * @property includeInactive - forcé à true seulement pour ADMIN
 */
export type GetAllBrigadesInput = {
  role: string
}

/**
 * Résultat retourné au frontend.
 * Liste de brigades avec métadonnées.
 */
export type GetAllBrigadesResult = {
  brigades: BrigadeEntity[]
  total: number
}

/**
 * Use-case GetAllBrigades.
 *
 * RÈGLES MÉTIER :
 * 1. ADMIN → voit toutes les brigades (actives + inactives)
 * 2. IGT   → voit seulement les brigades actives
 * 3. BRIGADE → même chose que IGT (sa brigade sera filtrée dans la route)
 *
 * @param input             - rôle de l'utilisateur connecté
 * @param brigadeRepository - contrat repository (pas Prisma directement)
 */
export async function getAllBrigadesUseCase(
  input: GetAllBrigadesInput,
  brigadeRepository: IBrigadeRepository
): Promise<GetAllBrigadesResult> {

  // RÈGLE MÉTIER :
  // Seul l'ADMIN peut voir les brigades inactives
  // pour gérer l'ensemble du dispositif
  const includeInactive = input.role === 'ADMIN'

  // Appel au repository — pas de Prisma ici
  const brigades = await brigadeRepository.findAll(includeInactive)

  return {
    brigades,
    total: brigades.length
    // total utile pour le frontend (pagination, affichage "4 brigades")
  }
}