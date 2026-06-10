import type { IControleRepository } from '../../domain/repositories/controle.repository.js'
import type { IMissionRepository } from '../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { ControleEntity } from '../../domain/entities/controle.entity.js'
import { NotFoundError, ForbiddenError } from '../../domain/errors.js'

export type GetControlesInput = {
  missionId: string
  userRole: string
  userBrigadeId: string | undefined
}

export async function getControlesUseCase(
  input: GetControlesInput,
  controleRepository: IControleRepository,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
): Promise<ControleEntity[]> {

  const mission = await missionRepository.findById(input.missionId)
  if (!mission) throw new NotFoundError('Mission')

  const fiche = await ficheRepository.findById(mission.ficheId)
  if (!fiche) throw new NotFoundError('Fiche journalière')

  if (input.userRole === 'BRIGADE' && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError()
  }

  return controleRepository.findByMission(input.missionId)
}