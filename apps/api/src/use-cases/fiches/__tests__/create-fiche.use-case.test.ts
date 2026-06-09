/**
 * @file create-fiche.use-case.test.ts
 * @description Tests unitaires — création d'une fiche journalière.
 *
 * CE QU'ON TESTE :
 * ✅ Création réussie
 * ✅ Normalisation de la date à minuit
 * ❌ Brigade inexistante → NotFoundError
 * ❌ Brigade inactive → ForbiddenError
 * ❌ Doublon du jour → ConflictError
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createFicheUseCase } from '../create-fiche.use-case.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../../../domain/errors.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { IBrigadeRepository } from '../../../domain/brigade.repository.js'
import type { FicheEntity } from '../../../domain/entities/fiche.entity.js'
import type { BrigadeWithMembers } from '../../../domain/entities/brigade.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const brigadeActive: BrigadeWithMembers = {
  id: 'brigade-01',
  nom: 'Équipe 01',
  chef: 'M. AIT KADIR',
  actif: true,
  createdAt: new Date('2025-12-01'),
  membres: []
}

const brigadeInactive: BrigadeWithMembers = {
  ...brigadeActive,
  actif: false
}

const ficheCreee: FicheEntity = {
  id: 'fiche-001',
  date: new Date('2026-06-08T00:00:00.000Z'),
  statut: 'BROUILLON',
  observations: null,
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockFicheRepository: IFicheRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBrigadeAndDate: vi.fn(),
  create: vi.fn(),
  updateStatut: vi.fn(),
  update: vi.fn()
}

const mockBrigadeRepository: IBrigadeRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByNom: vi.fn(),
  create: vi.fn(),
  update: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('createFicheUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── CAS NOMINAL ──────────────────────────────────────────────────────────────

  describe('✅ Création réussie', () => {

    it('crée une fiche en statut BROUILLON', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(null)
      vi.mocked(mockFicheRepository.create).mockResolvedValue(ficheCreee)

      // ACT
      const result = await createFicheUseCase(
        {
          date: new Date('2026-06-08'),
          brigadeId: 'brigade-01',
          createurId: 'user-001'
        },
        mockFicheRepository,
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.statut).toBe('BROUILLON')
      expect(result.brigadeId).toBe('brigade-01')
      expect(result.validateurId).toBeNull()
    })

    it('normalise la date à minuit avant création', async () => {
      // ARRANGE
      // Brigade crée à 14h30 → doit être normalisée à 00h00
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(null)
      vi.mocked(mockFicheRepository.create).mockResolvedValue(ficheCreee)

      // ACT
      await createFicheUseCase(
        {
          date: new Date('2026-06-08T14:30:00'),
          // 14h30 → doit devenir 00h00
          brigadeId: 'brigade-01',
          createurId: 'user-001'
        },
        mockFicheRepository,
        mockBrigadeRepository
      )

      // ASSERT — create appelé avec date normalisée à minuit
      const datePassee = vi.mocked(mockFicheRepository.create).mock.calls[0][0].date
      expect(datePassee.getHours()).toBe(0)
      expect(datePassee.getMinutes()).toBe(0)
      expect(datePassee.getSeconds()).toBe(0)
      expect(datePassee.getMilliseconds()).toBe(0)
    })

    it('crée la fiche avec les observations si fournies', async () => {
      // ARRANGE
      const ficheAvecObs = { ...ficheCreee, observations: 'Journée difficile - pluie' }
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(null)
      vi.mocked(mockFicheRepository.create).mockResolvedValue(ficheAvecObs)

      // ACT
      const result = await createFicheUseCase(
        {
          date: new Date('2026-06-08'),
          brigadeId: 'brigade-01',
          createurId: 'user-001',
          observations: 'Journée difficile - pluie'
        },
        mockFicheRepository,
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.observations).toBe('Journée difficile - pluie')
    })

    it('vérifie la brigade AVANT de vérifier le doublon', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(null)
      vi.mocked(mockFicheRepository.create).mockResolvedValue(ficheCreee)

      // ACT
      await createFicheUseCase(
        { date: new Date(), brigadeId: 'brigade-01', createurId: 'user-001' },
        mockFicheRepository,
        mockBrigadeRepository
      )

      // ASSERT — ordre correct
      const findByIdOrder = vi.mocked(mockBrigadeRepository.findById).mock.invocationCallOrder[0]
      const findByDateOrder = vi.mocked(mockFicheRepository.findByBrigadeAndDate).mock.invocationCallOrder[0]
      expect(findByIdOrder).toBeLessThan(findByDateOrder)
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la brigade n\'existe pas', async () => {
      // SCÉNARIO : brigadeId invalide dans le JWT
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(null)

      await expect(
        createFicheUseCase(
          { date: new Date(), brigadeId: 'brigade-inexistante', createurId: 'user-001' },
          mockFicheRepository,
          mockBrigadeRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance ForbiddenError si la brigade est inactive', async () => {
      // SCÉNARIO : Brigade 04 suspendue pendant Aid Al-Fitr
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeInactive)

      await expect(
        createFicheUseCase(
          { date: new Date(), brigadeId: 'brigade-01', createurId: 'user-001' },
          mockFicheRepository,
          mockBrigadeRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('lance ConflictError si une fiche existe déjà pour ce jour', async () => {
      // SCÉNARIO : Brigade essaie de créer une 2ème fiche le même jour
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(ficheCreee)
      // ficheCreee ≠ null → doublon détecté

      await expect(
        createFicheUseCase(
          { date: new Date('2026-06-08'), brigadeId: 'brigade-01', createurId: 'user-001' },
          mockFicheRepository,
          mockBrigadeRepository
        )
      ).rejects.toThrow(ConflictError)
    })

    it('le message ConflictError mentionne la brigade et la date', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(ficheCreee)

      // ACT
      const erreur = await createFicheUseCase(
        { date: new Date('2026-06-08'), brigadeId: 'brigade-01', createurId: 'user-001' },
        mockFicheRepository,
        mockBrigadeRepository
      ).catch(e => e)

      // ASSERT — message utile pour debug
      expect(erreur.message).toContain('Équipe 01')
    })

    it('ne crée pas si brigade inactive', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeInactive)

      // ACT
      await createFicheUseCase(
        { date: new Date(), brigadeId: 'brigade-01', createurId: 'user-001' },
        mockFicheRepository,
        mockBrigadeRepository
      ).catch(() => {})

      // ASSERT — create jamais appelé
      expect(mockFicheRepository.create).not.toHaveBeenCalled()
    })

    it('ne crée pas si doublon détecté', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeActive)
      vi.mocked(mockFicheRepository.findByBrigadeAndDate).mockResolvedValue(ficheCreee)

      // ACT
      await createFicheUseCase(
        { date: new Date(), brigadeId: 'brigade-01', createurId: 'user-001' },
        mockFicheRepository,
        mockBrigadeRepository
      ).catch(() => {})

      // ASSERT
      expect(mockFicheRepository.create).not.toHaveBeenCalled()
    })
  })
})