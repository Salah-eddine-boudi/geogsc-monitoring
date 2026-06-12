/**
 * @file create-cp.use-case.ts
 * @description Use-case : créer un compte rendu CP hebdomadaire.
 *
 * CONTEXTE MÉTIER :
 * Chaque semaine, le chef de brigade crée son CP.
 * Un seul CP par brigade par semaine (contrainte unique BDD).
 * Le CP reste en BROUILLON jusqu'à soumission.
 *
 * RÈGLES MÉTIER :
 * 1. Une brigade ne peut avoir qu'un CP par semaine
 * 2. Seule la brigade crée son propre CP
 * 3. Le CP est créé en BROUILLON
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { AppError, ForbiddenError } from '../../domain/errors.js'

export type CreateCPInput = {
  semaine: number      // numéro semaine ISO 1-53
  annee: number        // ex: 2026
  observations?: string
  userBrigadeId: string | undefined
  userRole: string
  brigadeId: string
  createurId: string
}

export async function createCPUseCase(input: CreateCPInput) {

  // Contrôle d'accès — brigade crée seulement son CP
  if (
    input.userRole === 'BRIGADE' &&
    input.userBrigadeId !== input.brigadeId
  ) {
    throw new ForbiddenError()
  }

  // Vérifie qu'il n'existe pas déjà un CP pour cette semaine
  const existing = await prisma.compteRenduCP.findUnique({
    where: {
      brigadeId_semaine_annee: {
        brigadeId: input.brigadeId,
        semaine: input.semaine,
        annee: input.annee
      }
    }
  })

  if (existing) {
    throw new AppError(
      'CONFLICT',
      `Un CP existe déjà pour la semaine ${input.semaine}/${input.annee}`,
      409
    )
  }

  return prisma.compteRenduCP.create({
    data: {
      semaine: input.semaine,
      annee: input.annee,
      brigadeId: input.brigadeId,
      createurId: input.createurId,
      observations: input.observations ?? null,
      statut: 'BROUILLON'
    },
    include: {
      brigade: { select: { id: true, nom: true, chef: true } },
      createur: { select: { id: true, nom: true, prenom: true } },
      evenements: true,
      pointsVigilance: true
    }
  })
}