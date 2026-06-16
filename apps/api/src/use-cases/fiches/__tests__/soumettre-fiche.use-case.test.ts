/**
 * @file soumettre-fiche.use-case.test.ts
 * @description Tests unitaires — soumission d'une fiche.
 *
 * CE QU'ON TESTE :
 *  Soumission depuis BROUILLON → SOUMISE
 *  Soumission depuis REJETEE → SOUMISE (après correction)
 *  Fiche inexistante → NotFoundError
 *  Fiche d'une autre brigade → ForbiddenError
 *  Fiche déjà SOUMISE → AppError STATUT_INVALIDE
 *  Fiche VALIDEE → AppError STATUT_INVALIDE
 *  Fiche vide (0 missions) → AppError FICHE_VIDE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { soumettreUseCase } from '../soumettre-fiche.use-case.js'
import { NotFoundError, ForbiddenError, AppError } from '../../../domain/errors.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { FicheWithRelations } from '../../../domain/entities/fiche.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

/**
 * Fiche de base avec 2 missions — prête à être soumise.
 */
const ficheBrouillon: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date('2026-06-08'),
  statut: 'BROUILLON',
  observations: null,
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  brigade: { id: 'brigade-01', nom: 'Équipe 01', chef: 'M. AIT KADIR' },
  createur: { id: 'user-001', nom: 'AIT KADIR', prenom: 'Marouane' },
  validateur: null,
  missions: [],
  _count: { missions: 2 }
  
}

const ficheRejetee: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'REJETEE',
  // après correction → peut être soumise à nouveau
}

const ficheSoumise: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'SOUMISE'
}

const ficheValidee: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'VALIDEE'
}

const ficheVide: FicheWithRelations = {
  ...ficheBrouillon,
  _count: { missions: 0 }
  // 0 missions → ne peut pas être soumise
}

const ficheSoumiseResult = {
  ...ficheBrouillon,
  statut: 'SOUMISE' as const
}

// ─── MOCK ─────────────────────────────────────────────────────────────────────

const mockFicheRepository: IFicheRepository = {
  findAll: vi.fn(),  
  findById: vi.fn(), 
  findByBrigadeAndDate: vi.fn(),
  create: vi.fn(),
  updateStatut: vi.fn(),
  update: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('soumettreUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── CAS NOMINAL ──────────────────────────────────────────────────────────────

  describe('✅ Soumission réussie', () => {

    it('soumet une fiche BROUILLON → SOUMISE', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon) 
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheSoumiseResult)

      // ACT
      const result = await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      )

      // ASSERT
      expect(result.statut).toBe('SOUMISE')
      expect(mockFicheRepository.updateStatut).toHaveBeenCalledWith(
        'fiche-001',
        { statut: 'SOUMISE' }
      )
    })

    it('soumet une fiche REJETEE → SOUMISE (après correction)', async () => {
      // SCÉNARIO : Brigade corrige sa fiche rejetée et resoumet
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheRejetee)
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheSoumiseResult)

      // ACT
      const result = await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      )

      // ASSERT
      expect(result.statut).toBe('SOUMISE')
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la fiche n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(null)

      await expect(
        soumettreUseCase(
          { ficheId: 'fiche-inexistante', userId: 'user-001', userBrigadeId: 'brigade-01' },
          mockFicheRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance ForbiddenError si la fiche appartient à une autre brigade', async () => {
      // SCÉNARIO : Brigade 02 essaie de soumettre la fiche de Brigade 01
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      // ficheBrouillon.brigadeId = 'brigade-01'
      // userBrigadeId = 'brigade-02' → accès interdit

      await expect(
        soumettreUseCase(
          { ficheId: 'fiche-001', userId: 'user-002', userBrigadeId: 'brigade-02' },
          mockFicheRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('lance AppError STATUT_INVALIDE si fiche déjà SOUMISE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche VALIDEE', async () => {
      // SCÉNARIO : fiche déjà validée → immuable
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheValidee)

      const erreur = await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError FICHE_VIDE si aucune mission', async () => {
      // SCÉNARIO : Brigade essaie de soumettre sans avoir ajouté de missions
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheVide)

      const erreur = await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('FICHE_VIDE')
    })

    it('ne change pas le statut si erreur', async () => {
      // ARRANGE — fiche déjà soumise
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      // ACT
      await soumettreUseCase(
        { ficheId: 'fiche-001', userId: 'user-001', userBrigadeId: 'brigade-01' },
        mockFicheRepository
      ).catch(() => {})

      // ASSERT — updateStatut jamais appelé
      expect(mockFicheRepository.updateStatut).not.toHaveBeenCalled()
    })
  })
})