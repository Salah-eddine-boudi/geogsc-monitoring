import { FastifyPluginAsync } from 'fastify'
import { requireRole } from '../plugins/auth.plugin.js'
import { uploadPhotoUseCase } from '../../use-cases/photos/upload-photo.use-case.js'
import { PhotoPrismaRepository } from '../../infrastructure/prisma/repositories/photo.prisma.repo.js'
import { MissionPrismaRepository } from '../../infrastructure/prisma/repositories/mission.prisma.repo.js'
import { FichePrismaRepository } from '../../infrastructure/prisma/repositories/fiche.prisma.repo.js' // 1. Import nécessaire
import type { JwtPayload } from '../../domain/types.js'

const photoRepository = new PhotoPrismaRepository()
const missionRepository = new MissionPrismaRepository()
const ficheRepository = new FichePrismaRepository() // 2. Instanciation

export const photosRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { missionId } = request.params as { missionId: string }
    
    const data = await request.files()
    
    // 3. Passage du ficheRepository ici
    const photos = await uploadPhotoUseCase(
      { missionId, userBrigadeId: payload.brigadeId, files: data },
      photoRepository,
      missionRepository,
      ficheRepository // Correction ici
    )

    return reply.status(201).send({ success: true, photos })
  })
}