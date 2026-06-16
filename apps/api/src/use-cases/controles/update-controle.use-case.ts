import type { IControleRepository, CreateControleData } from '../../domain/repositories/controle.repository.js'
import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { ControleEntity } from '../../domain/entities/controle.entity.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type UpdateControleInput = {
  controleId: string
  userRole: string
  userBrigadeId: string | undefined
  type?: 'IMPLANTATION' | 'ALTIMETRIE' | 'VERTICALITY' | 'RECEPTION' | 'CONTRADICTOIRE'
  ecartX?: number
  ecartY?: number
  ecartZ?: number
  toleranceX?: number
  toleranceY?: number
  toleranceZ?: number
  observations?: string
}

export async function updateControleUseCase(
  input: UpdateControleInput,
  controleRepository: IControleRepository,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<ControleEntity> {

  // Vérifie que le contrôle existe
  const controle = await controleRepository.findById(input.controleId)
  if (!controle) throw new NotFoundError('Contrôle')

  // Vérifie la mission parente
  const mission = await missionRepository.findById(controle.missionId)
  if (!mission) throw new NotFoundError('Mission')

  // Vérifie la fiche parente
  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  // Contrôle d'accès Brigade
  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  // Fiche doit être en BROUILLON
  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible de modifier un contrôle dans une fiche en statut "${fiche.statut}"`,
      400
    )
  }

  // Le statut est recalculé automatiquement dans le repository
  const { controleId, userRole, userBrigadeId, ...data } = input
  return controleRepository.update(controleId, data)
}