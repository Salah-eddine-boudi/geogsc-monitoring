/**
 * @file get-cp.use-case.ts
 * @description Use-cases : récupérer les CPs.
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError, ForbiddenError } from '../../domain/errors.js'

/**
 * Récupère tous les CPs d'une brigade pour une année.
 */
export async function getCPsBrigadeUseCase(
  brigadeId: string,
  annee: number,
  userRole: string,
  userBrigadeId: string | undefined
) {
  // Brigade ne voit que ses propres CPs
  if (userRole === 'BRIGADE' && userBrigadeId !== brigadeId) {
    throw new ForbiddenError()
  }

  return prisma.compteRenduCP.findMany({
    where: { brigadeId, annee },
    include: {
      brigade: { select: { id: true, nom: true, chef: true } },
      createur: { select: { id: true, nom: true, prenom: true } },
      evenements: true,
      pointsVigilance: true,
      _count: {
        select: {
          evenements: true,
          pointsVigilance: true
        }
      }
    },
    orderBy: { semaine: 'desc' }
  })
}

/**
 * Récupère un CP par ID avec toutes ses relations.
 */
export async function getCPByIdUseCase(
  cpId: string,
  userRole: string,
  userBrigadeId: string | undefined
) {
  const cp = await prisma.compteRenduCP.findUnique({
    where: { id: cpId },
    include: {
      brigade: { select: { id: true, nom: true, chef: true } },
      createur: { select: { id: true, nom: true, prenom: true } },
      evenements: { orderBy: { date: 'asc' } },
      pointsVigilance: { orderBy: { criticite: 'asc' } }
    }
  })

  if (!cp) throw new NotFoundError('Compte rendu CP')

  // Brigade ne voit que son propre CP
  if (userRole === 'BRIGADE' && userBrigadeId !== cp.brigadeId) {
    throw new ForbiddenError()
  }

  return cp
}