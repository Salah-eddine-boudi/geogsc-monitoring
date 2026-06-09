import { prisma } from '../prisma.js'
import type { IOuvrageRepository } from '../../../domain/repositories/ouvrage.repository.js'
import type { OuvrageEntity } from '../../../domain/entities/ouvrage.entity.js'

export class OuvragePrismaRepository implements IOuvrageRepository {

  async findAll(includeInactive = false): Promise<OuvrageEntity[]> {
    return prisma.ouvrage.findMany({
      where: includeInactive ? undefined : { actif: true },
      orderBy: { reference: 'asc' }
    })
  }

  async findById(id: string): Promise<OuvrageEntity | null> {
    return prisma.ouvrage.findUnique({ where: { id } })
  }

  async findByReference(reference: string): Promise<OuvrageEntity | null> {
    return prisma.ouvrage.findUnique({ where: { reference } })
  }
}
