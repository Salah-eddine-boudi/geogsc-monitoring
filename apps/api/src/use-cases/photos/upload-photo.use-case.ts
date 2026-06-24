import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { IPhotoRepository } from '../../domain/repositories/photo.repository.js';
import type { IMissionRepository } from '../../domain/repositories/mission.repository.js';
import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors.js';

export async function uploadPhotoUseCase(
  input: { missionId: string; userBrigadeId?: string; files: any },
  photoRepository: IPhotoRepository,
  missionRepository: IMissionRepository,
  ficheRepository: IFicheRepository
) {
  const mission = await missionRepository.findById(input.missionId);
  if (!mission) throw new NotFoundError('Mission');

  const fiche = await ficheRepository.findById(mission.ficheId);
  if (!fiche) throw new NotFoundError('Fiche journalière');

  if (input.userBrigadeId && fiche.brigadeId !== input.userBrigadeId) {
    throw new ForbiddenError();
  }

  const uploadDir = path.join(process.cwd(), 'uploads', 'missions');
  await fs.mkdir(uploadDir, { recursive: true });

  const savedPhotos = [];

  for await (const part of input.files) {
    if (part.type === 'file') {
      const buffer = await part.toBuffer();
      const fileName = `${input.missionId}_${randomUUID()}.jpg`;
      const filePath = path.join(uploadDir, fileName);

      // Compression intelligente : redimensionnement max 1200px et qualité 80%
      await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(filePath);

      const photo = await photoRepository.create({
        missionId: input.missionId,
        url: `/uploads/missions/${fileName}`,
        taille: buffer.length
      });

      savedPhotos.push(photo);
    }
  }

  return savedPhotos;
}