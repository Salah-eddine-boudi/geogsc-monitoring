/**
 * @file get-fiches.use-case.ts
 * @description Use-case : récupérer la liste des fiches avec filtres.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIOS SELON LE RÔLE :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 👷 BRIGADE (M. AIT KADIR) :
 * → voit SEULEMENT ses propres fiches
 * → ne peut pas voir les fiches des autres brigades
 * → peut filtrer par statut et date
 *
 * 🔍 IGT (M. CHAACHOUI) :
 * → voit TOUTES les fiches de toutes les brigades
 * → filtre typique : statut=SOUMISE pour voir ce qui est à valider
 * → peut filtrer par brigade, date, statut
 *
 * 👑 ADMIN :
 * → mêmes droits que IGT
 * → peut voir tout l'historique
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PAGINATION :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * On ne charge jamais toutes les fiches en mémoire.
 * Après 36 mois de chantier → des milliers de fiches.
 * La pagination limite à 20 fiches par page.
 */

import type { IFicheRepository, FicheFilters } from '../../domain/repositories/fiche.repository.js'
import type { FicheEntity } from '../../domain/entities/fiche.entity.js'
import type { PaginatedResult } from '../../domain/types.js'

/**
 * Paramètres du use-case.
 *
 * @property userRole     - rôle de l'utilisateur connecté
 * @property userBrigadeId - brigade de l'utilisateur (null pour IGT/ADMIN)
 * @property filters      - filtres optionnels
 */
export type GetFichesInput = {
  userRole: string
  userBrigadeId: string | undefined
  filters: {
    brigadeId?: string
    statut?: 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'REJETEE'
    dateDebut?: Date
    dateFin?: Date
    page?: number
    limit?: number
  }
}

export type GetFichesResult = PaginatedResult<FicheEntity> & {
  page: number
  totalPages: number
}

/**
 * Use-case GetFiches.
 *
 * RÈGLE DE SÉCURITÉ IMPORTANTE :
 * Si l'utilisateur est BRIGADE → on force brigadeId = sa brigade
 * Même si le frontend envoie un autre brigadeId → ignoré
 * → Un chef de brigade ne peut jamais voir les fiches d'une autre brigade
 *
 * @param input           - rôle + brigade + filtres
 * @param ficheRepository - contrat repository
 */
export async function getFichesUseCase(
  input: GetFichesInput,
  ficheRepository: IFicheRepository
): Promise<GetFichesResult> {

  const limit = input.filters.limit ?? 20
  const page = input.filters.page ?? 1

  // ── RÈGLE DE SÉCURITÉ ────────────────────────────────────────────────────────
  // BRIGADE → force le filtre sur SA brigade
  // IGT/ADMIN → utilise le filtre fourni (ou pas de filtre)
  const brigadeIdFiltre = input.userRole === 'BRIGADE'
    ? input.userBrigadeId   // forcé → sa brigade seulement
    : input.filters.brigadeId  // optionnel → filtre choisi par IGT/ADMIN

  // Construction des filtres finaux
  const filters: FicheFilters = {
    brigadeId: brigadeIdFiltre,
    statut: input.filters.statut,
    dateDebut: input.filters.dateDebut,
    dateFin: input.filters.dateFin,
    page,
    limit
  }

  const { fiches, total } = await ficheRepository.findAll(filters)

  // Calcul du nombre total de pages
  // Math.ceil arrondit au supérieur
  // 21 fiches / 20 par page = 1.05 → ceil → 2 pages
  const totalPages = Math.ceil(total / limit)

  return {
    data: fiches,     // PaginatedResult.data
    pagination: {
      page,
      limit,
      total
    },
    page,
    totalPages
  }
}