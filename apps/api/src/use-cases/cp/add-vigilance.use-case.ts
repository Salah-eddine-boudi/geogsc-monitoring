import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type AddVigilanceInput = {
  cpId: string
  criticite: 'HAUTE' | 'MOYENNE' | 'FAIBLE'
  description: string
  action?: string
  responsable?: string
  echeance?: Date
  userRole: string
  userBrigadeId: string | undefined
}

export async function addVigilanceUseCase(input: AddVigilanceInput) {
  const cp = await prisma.compteRenduCP.findUnique({
    where: { id: input.cpId }
  })

  if (!cp) throw new NotFoundError('Compte rendu CP')

  if (input.userRole === 'BRIGADE' && input.userBrigadeId !== cp.brigadeId) {
    throw new ForbiddenError()
  }

  if (cp.statut !== 'BROUILLON') {
    throw new AppError('STATUT_INVALIDE', 'CP déjà soumis', 400)
  }

  return prisma.pointVigilanceCP.create({
    data: {
      cpId: input.cpId,
      criticite: input.criticite,
      description: input.description,
      action: input.action ?? null,
      responsable: input.responsable ?? null,
      echeance: input.echeance ?? null,
      resolu: false
    }
  })
}