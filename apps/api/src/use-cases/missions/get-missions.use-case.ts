import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { MissionWithRelations } from '../../domain/entities/mission.entity.js'
import { NotFoundError, ForbiddenError } from '../../domain/errors.js'

export type GetMissionsInput = {
  ficheId: string
  userRole: string
  userBrigadeId: string | undefined
}

export async function getMissionsUseCase(
  input: GetMissionsInput,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<MissionWithRelations[]> {

  const fiche = await ficheRepository.findById(input.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  return missionRepository.findByFiche(input.ficheId)
}
