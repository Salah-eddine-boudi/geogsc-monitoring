/**
 * @file get-fiches.use-case.ts
 * @description Use-case : récupérer la liste des fiches avec filtres.
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
 * @param input           
 * @param ficheRepository 
 */
export async function getFichesUseCase(
  input: GetFichesInput,
  ficheRepository: IFicheRepository
): Promise<GetFichesResult> {

  const limit = input.filters.limit ?? 20
  const page = input.filters.page ?? 1


  const brigadeIdFiltre = input.userRole === 'BRIGADE'
    ? input.userBrigadeId  
    : input.filters.brigadeId  


  const filters: FicheFilters = {
    brigadeId: brigadeIdFiltre,
    statut: input.filters.statut,
    dateDebut: input.filters.dateDebut,
    dateFin: input.filters.dateFin,
    page,
    limit
  }

  const { fiches, total } = await ficheRepository.findAll(filters)

  
  const totalPages = Math.ceil(total / limit)

  return {
    data: fiches,     
    pagination: {
      page,
      limit,
      total
    },
    page,
    totalPages
  }
}