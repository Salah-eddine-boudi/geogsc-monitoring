/**
 * @file soumettre-cp.use-case.ts
 * @description Use-case : soumettre un CP pour validation IGT.
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export async function soumettreCP(
  cpId: string,
  userRole: string,
  userBrigadeId: string | undefined
) {
  const cp = await prisma.compteRenduCP.findUnique({
    where: { id: cpId },
    include: {
      _count: { select: { evenements: true } }
    }
  })

  if (!cp) throw new NotFoundError('Compte rendu CP')

  if (userRole === 'BRIGADE' && userBrigadeId !== cp.brigadeId) {
    throw new ForbiddenError()
  }

  if (cp.statut !== 'BROUILLON') {
    throw new AppError('STATUT_INVALIDE', 'Le CP est déjà soumis ou validé', 400)
  }

  // Un CP vide ne peut pas être soumis
  if (cp._count.evenements === 0) {
    throw new AppError(
      'CP_VIDE',
      'Ajoutez au moins un événement avant de soumettre',
      400
    )
  }

  return prisma.compteRenduCP.update({
    where: { id: cpId },
    data: { statut: 'SOUMIS' }
  })
}