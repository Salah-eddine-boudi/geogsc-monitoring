/**
 * @file fiche.prisma.repo.ts
 * @description Implémentation Prisma du IFicheRepository.
 */

import { prisma } from '../prisma.js'
import type { IFicheRepository, FicheFilters } from '../../../domain/repositories/fiche.repository.js'
import type { FicheEntity, FicheWithRelations } from '../../../domain/entities/fiche.entity.js'

export class FichePrismaRepository implements IFicheRepository {

  async findAll(filters: FicheFilters): Promise<{ fiches: FicheEntity[]; total: number }> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit
    // skip = combien d'enregistrements sauter
    // page 1 → skip 0  (0 * 20 = 0)
    // page 2 → skip 20 (1 * 20 = 20)
    // page 3 → skip 40 (2 * 20 = 40)

    // Construction du filtre Prisma dynamiquement
    const where = {
      // brigadeId: undefined → pas de filtre (IGT voit tout)
      // brigadeId: 'brigade-01' → seulement cette brigade
      ...(filters.brigadeId && { brigadeId: filters.brigadeId }),
      ...(filters.statut && { statut: filters.statut }),
      ...(filters.dateDebut || filters.dateFin) && {
        date: {
          ...(filters.dateDebut && { gte: filters.dateDebut }),
          // gte = greater than or equal = >=
          ...(filters.dateFin && { lte: filters.dateFin })
          // lte = less than or equal = <=
        }
      }
    }

    // Lance les deux requêtes en parallèle pour optimiser
    const [fiches, total] = await Promise.all([
      prisma.ficheJournaliere.findMany({
        where,
        orderBy: { date: 'desc' }, // plus récentes en premier
        skip,
        take: limit  // LIMIT en SQL
      }),
      prisma.ficheJournaliere.count({ where })
      // COUNT(*) pour la pagination
    ])

    return { fiches, total }
  }

  async findById(id: string): Promise<FicheWithRelations | null> {
    return prisma.ficheJournaliere.findUnique({
      where: { id },
      include: {
        // Jointures automatiques Prisma
        brigade: {
          select: { id: true, nom: true, chef: true }
        },
        createur: {
          select: { id: true, nom: true, prenom: true }
        },
        validateur: {
          select: { id: true, nom: true, prenom: true }
        },
        missions: {
          include: {
            ouvrage: {
              select: {
                id: true,
                reference: true,
                designation: true,
                type: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { missions: true }
          // compte le nombre de missions sans les charger toutes
        }
      }
    }) as Promise<FicheWithRelations | null>
  }

  async findByBrigadeAndDate(brigadeId: string, date: Date): Promise<FicheEntity | null> {
    // Normalise la date à minuit pour comparer seulement le jour
    const dateDebut = new Date(date)
    dateDebut.setHours(0, 0, 0, 0)

    const dateFin = new Date(date)
    dateFin.setHours(23, 59, 59, 999)

    return prisma.ficheJournaliere.findFirst({
      where: {
        brigadeId,
        date: {
          gte: dateDebut,
          lte: dateFin
        }
      }
    })
  }

  async create(data: {
    date: Date
    brigadeId: string
    createurId: string
    observations?: string
  }): Promise<FicheEntity> {
    return prisma.ficheJournaliere.create({
      data: {
        date: data.date,
        brigadeId: data.brigadeId,
        createurId: data.createurId,
        observations: data.observations ?? null,
        statut: 'BROUILLON'
        // statut par défaut = BROUILLON
      }
    })
  }

  async updateStatut(id: string, data: {
    statut: 'SOUMISE' | 'VALIDEE' | 'REJETEE'
    validateurId?: string
    observations?: string
  }): Promise<FicheEntity> {
    return prisma.ficheJournaliere.update({
      where: { id },
      data: {
        statut: data.statut,
        ...(data.validateurId && { validateurId: data.validateurId }),
        ...(data.observations !== undefined && { observations: data.observations })
      }
    })
  }

  async update(id: string, data: { observations?: string }): Promise<FicheEntity> {
    return prisma.ficheJournaliere.update({
      where: { id },
      data
    })
  }
}