import type { IControleRepository } from '../../domain/repositories/controle.repository.js'
import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type DeleteControleInput = {
  controleId: string
  userRole: string
  userBrigadeId: string | undefined
}

export async function deleteControleUseCase(
  input: DeleteControleInput,
  controleRepository: IControleRepository,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<void> {

  const controle = await controleRepository.findById(input.controleId)
  if (!controle) throw new NotFoundError('Contrôle')

  const mission = await missionRepository.findById(controle.missionId)
  if (!mission) throw new NotFoundError('Mission')

  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  if (fiche.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      `Impossible de supprimer un contrôle dans une fiche en statut "${fiche.statut}"`,
      400
    )
  }

  await controleRepository.delete(input.controleId)
}