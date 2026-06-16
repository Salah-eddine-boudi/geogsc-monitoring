/**
 * @file create-cp.use-case.test.ts
 * @description Tests unitaires — création CP hebdomadaire.
 *
 * CE QU'ON TESTE :
 *  CP créé avec succès
 *  Brigade crée son propre CP
 *  Brigade essaie de créer le CP d'une autre brigade → FORBIDDEN
 *  CP déjà existant pour cette semaine → CONFLICT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCPUseCase } from '../create-cp.use-case.js'
import { AppError, ForbiddenError } from '../../../domain/errors.js'

/**
 * Mock de Prisma — on ne veut pas toucher la vraie BDD
 * dans les tests unitaires.
 *
 * vi.mock() → remplace le module par une version simulée.
 * Chaque fonction retourne une valeur contrôlée par le test.
 */
vi.mock('../../../infrastructure/prisma/prisma.js', () => ({
  prisma: {
    compteRenduCP: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

import { prisma } from '../../../infrastructure/prisma/prisma.js'

describe('createCPUseCase', () => {

  /**
   * beforeEach → réinitialise les mocks avant chaque test.
   * Évite que les retours d'un test influencent le suivant.
   */
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const baseInput = {
    semaine: 23,
    annee: 2026,
    brigadeId: 'brigade-01',
    createurId: 'user-brigade-01',
    userBrigadeId: 'brigade-01',
    userRole: 'BRIGADE'
  }

  const cpCreated = {
    id: 'cp-001',
    semaine: 23,
    annee: 2026,
    statut: 'BROUILLON',
    brigadeId: 'brigade-01',
    createurId: 'user-brigade-01',
    observations: null,
    brigade: { id: 'brigade-01', nom: 'Équipe 01', chef: 'M. AIT KADIR' },
    createur: { id: 'user-brigade-01', nom: 'AIT KADIR', prenom: 'Marouane' },
    evenements: [],
    pointsVigilance: []
  }

  describe('✅ Création réussie', () => {

    it('crée un CP en BROUILLON pour la brigade', async () => {
      // ARRANGE — pas de CP existant
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.compteRenduCP.create).mockResolvedValue(cpCreated as any)

      // ACT
      const result = await createCPUseCase(baseInput)

      // ASSERT
      expect(result.statut).toBe('BROUILLON')
      expect(result.semaine).toBe(23)
      expect(result.annee).toBe(2026)
    })

    it('appelle prisma.create avec les bonnes données', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.compteRenduCP.create).mockResolvedValue(cpCreated as any)

      await createCPUseCase(baseInput)

      expect(prisma.compteRenduCP.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            semaine: 23,
            annee: 2026,
            brigadeId: 'brigade-01',
            statut: 'BROUILLON'
          })
        })
      )
    })

    it('IGT peut créer un CP pour n\'importe quelle brigade', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.compteRenduCP.create).mockResolvedValue(cpCreated as any)

      // IGT avec brigadeId différent
      await expect(createCPUseCase({
        ...baseInput,
        userRole: 'IGT',
        userBrigadeId: 'autre-brigade'
      })).resolves.not.toThrow()
    })
  })

  describe('❌ Erreurs métier', () => {

    it('lève ForbiddenError si brigade essaie de créer le CP d\'une autre brigade', async () => {
      await expect(createCPUseCase({
        ...baseInput,
        userBrigadeId: 'brigade-DIFFERENTE'
        // brigadeId reste 'brigade-01' → mismatch → FORBIDDEN
      })).rejects.toThrow(ForbiddenError)
    })

    it('lève AppError CONFLICT si CP existe déjà pour cette semaine', async () => {
      // CP déjà existant
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(cpCreated as any)

      await expect(createCPUseCase(baseInput))
        .rejects.toThrow(AppError)

      // Vérifie le code d'erreur
      await expect(createCPUseCase(baseInput))
        .rejects.toMatchObject({ code: 'CONFLICT' })
    })
  })
})