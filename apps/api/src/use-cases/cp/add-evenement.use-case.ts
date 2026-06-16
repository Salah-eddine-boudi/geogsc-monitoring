/**
 * @file add-evenement.use-case.ts
 * @description Use-case : ajouter un événement à un CP.
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError, ForbiddenError, AppError } from '../../domain/errors.js'

export type AddEvenementInput = {
  cpId: string
  date: Date
  type: 'VISITE_CHANTIER' | 'REUNION' | 'INCIDENT' | 'CONSTAT' | 'AUTRE'
  description: string
  participants?: string
  lieu?: string
  userRole: string
  userBrigadeId: string | undefined
}

export async function addEvenementUseCase(input: AddEvenementInput) {

  const cp = await prisma.compteRenduCP.findUnique({
    where: { id: input.cpId }
  })

  if (!cp) throw new NotFoundError('Compte rendu CP')

  // Contrôle d'accès
  if (input.userRole === 'BRIGADE' && input.userBrigadeId !== cp.brigadeId) {
    throw new ForbiddenError()
  }

  // CP doit être en BROUILLON
  if (cp.statut !== 'BROUILLON') {
    throw new AppError(
      'STATUT_INVALIDE',
      'Impossible de modifier un CP soumis ou validé',
      400
    )
  }

  return prisma.evenementCP.create({
    data: {
      cpId: input.cpId,
      date: input.date,
      type: input.type,
      description: input.description,
      participants: input.participants ?? null,
      lieu: input.lieu ?? null
    }
  })
}