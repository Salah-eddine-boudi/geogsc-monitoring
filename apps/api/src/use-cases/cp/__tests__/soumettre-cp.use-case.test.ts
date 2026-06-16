/**
 * @file soumettre-cp.use-case.test.ts
 * @description Tests unitaires — soumission CP.
 *
 * CE QU'ON TESTE :
 * CP BROUILLON avec événements → SOUMIS
 * CP déjà SOUMIS → STATUT_INVALIDE
 * CP vide (0 événements) → CP_VIDE
 * Brigade tente de soumettre le CP d'une autre → FORBIDDEN
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { soumettreCP } from '../soumettre-cp.use-case.js'
import { AppError, ForbiddenError, NotFoundError } from '../../../domain/errors.js'

vi.mock('../../../infrastructure/prisma/prisma.js', () => ({
  prisma: {
    compteRenduCP: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

import { prisma } from '../../../infrastructure/prisma/prisma.js'

describe('soumettreCP', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const cpBrouillonAvecEvenements = {
    id: 'cp-001',
    statut: 'BROUILLON',
    brigadeId: 'brigade-01',
    _count: { evenements: 3 }
  }

  const cpSoumis = {
    id: 'cp-001',
    statut: 'SOUMIS',
    brigadeId: 'brigade-01'
  }

  describe('✅ Soumission réussie', () => {

    it('soumet un CP BROUILLON avec événements → SOUMIS', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(
        cpBrouillonAvecEvenements as any
      )
      vi.mocked(prisma.compteRenduCP.update).mockResolvedValue(cpSoumis as any)

      const result = await soumettreCP('cp-001', 'BRIGADE', 'brigade-01')

      expect(result.statut).toBe('SOUMIS')
      expect(prisma.compteRenduCP.update).toHaveBeenCalledWith({
        where: { id: 'cp-001' },
        data: { statut: 'SOUMIS' }
      })
    })
  })

  describe('❌ Erreurs métier', () => {

    it('lève NotFoundError si CP inexistant', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(null)

      await expect(soumettreCP('cp-inexistant', 'BRIGADE', 'brigade-01'))
        .rejects.toThrow(NotFoundError)
    })

    it('lève ForbiddenError si brigade tente de soumettre le CP d\'une autre', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue(
        cpBrouillonAvecEvenements as any
      )

      await expect(soumettreCP('cp-001', 'BRIGADE', 'brigade-DIFFERENTE'))
        .rejects.toThrow(ForbiddenError)
    })

    it('lève AppError STATUT_INVALIDE si CP déjà SOUMIS', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue({
        ...cpBrouillonAvecEvenements,
        statut: 'SOUMIS'
      } as any)

      await expect(soumettreCP('cp-001', 'BRIGADE', 'brigade-01'))
        .rejects.toMatchObject({ code: 'STATUT_INVALIDE' })
    })

    it('lève AppError CP_VIDE si aucun événement', async () => {
      vi.mocked(prisma.compteRenduCP.findUnique).mockResolvedValue({
        ...cpBrouillonAvecEvenements,
        _count: { evenements: 0 }
        // 0 événements → impossible de soumettre
      } as any)

      await expect(soumettreCP('cp-001', 'BRIGADE', 'brigade-01'))
        .rejects.toMatchObject({ code: 'CP_VIDE' })
    })
  })
})