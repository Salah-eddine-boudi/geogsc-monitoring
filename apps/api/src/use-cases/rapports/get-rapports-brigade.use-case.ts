/**
 * @file get-rapports-brigade.use-case.ts
 * @description Use-case : récupérer tous les rapports disponibles pour une brigade.
 *
 * SCÉNARIO :
 * IGT consulte l'historique des rapports de Brigade 01
 * → Liste des périodes disponibles avec statistiques résumées
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { calculerStatsRapport } from '../../domain/services/rapport.service.js'
import { NotFoundError, AppError } from '../../domain/errors.js'
import type { RapportStats } from '../../domain/entities/rapport.entity.js'

export type GetRapportsBrigadeInput = {
  brigadeId: string
  userRole: string
  userBrigadeId: string | undefined
  annee?: number
}

export async function getRapportsBrigadeUseCase(
  input: GetRapportsBrigadeInput
): Promise<RapportStats[]> {

  // Contrôle d'accès
  if (
    input.userRole === 'BRIGADE' &&
    input.userBrigadeId !== input.brigadeId
  ) {
    throw new AppError('FORBIDDEN', 'Accès interdit', 403)
  }

  // Vérifie la brigade
  const brigade = await prisma.brigade.findUnique({
    where: { id: input.brigadeId }
  })
  if (!brigade) throw new NotFoundError('Brigade')

  // Détermine l'année (par défaut : année en cours)
  const annee = input.annee ?? new Date().getFullYear()
  const dateDebut = new Date(annee, 0, 1)   // 1er janvier
  const dateFin = new Date(annee, 11, 31, 23, 59, 59)  // 31 décembre

  // Récupère toutes les fiches VALIDEES de l'année
  const fiches = await prisma.ficheJournaliere.findMany({
    where: {
      brigadeId: input.brigadeId,
      statut: 'VALIDEE',
      date: { gte: dateDebut, lte: dateFin }
    },
    include: {
      missions: {
        include: {
          ouvrage: {
            select: { id: true, reference: true, designation: true }
          },
          controles: { select: { statut: true } }
        }
      }
    }
  })

  // Groupe les fiches par mois
  const fichesPaMois = new Map<string, typeof fiches>()

  for (const fiche of fiches) {
    const date = new Date(fiche.date)
    const periode = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    // padStart(2, '0') → "5" devient "05"

    if (!fichesPaMois.has(periode)) {
      fichesPaMois.set(periode, [])
    }
    fichesPaMois.get(periode)!.push(fiche)
  }

  // Calcule les stats pour chaque mois
  const rapports: RapportStats[] = []

  for (const [periode, fichesMois] of fichesPaMois) {
    rapports.push(calculerStatsRapport(
      fichesMois,
      input.brigadeId,
      periode,
      { id: brigade.id, nom: brigade.nom, chef: brigade.chef }
    ))
  }

  // Trie par période décroissante (plus récent en premier)
  return rapports.sort((a, b) => b.periode.localeCompare(a.periode))
}