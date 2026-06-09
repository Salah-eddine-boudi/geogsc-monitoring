/**
 * @file valider-fiche.use-case.test.ts
 * @description Tests unitaires — validation et rejet d'une fiche.
 *
 * CE QU'ON TESTE :
 * Validation SOUMISE → VALIDEE
 * Rejet SOUMISE → REJETEE avec motif
 * Fiche inexistante → NotFoundError
 * Valider une fiche non SOUMISE → AppError
 * Rejeter sans motif → AppError MOTIF_REQUIS
 * Rejeter avec motif vide → AppError MOTIF_REQUIS
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validerFicheUseCase } from '../valider-fiche.use-case.js'
import { NotFoundError, AppError } from '../../../domain/errors.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { FicheWithRelations, FicheEntity } from '../../../domain/entities/fiche.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const ficheSoumise: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date('2026-06-08'),
  statut: 'SOUMISE',
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
  _count: { missions: 3 }
}

const ficheBrouillon: FicheWithRelations = { ...ficheSoumise, statut: 'BROUILLON' }
const ficheValidee: FicheWithRelations = { ...ficheSoumise, statut: 'VALIDEE' }
const ficheRejetee: FicheWithRelations = { ...ficheSoumise, statut: 'REJETEE' }

const ficheValideeResult: FicheEntity = {
  id: 'fiche-001',
  date: new Date('2026-06-08'),
  statut: 'VALIDEE',
  observations: null,
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: 'igt-001',
  createdAt: new Date(),
  updatedAt: new Date()
}

const ficheRejeteeResult: FicheEntity = {
  ...ficheValideeResult,
  statut: 'REJETEE',
  observations: 'Mission 2 : écart Z hors tolérance non documenté'
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

describe('validerFicheUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── VALIDATION ────────────────────────────────────────────────────────────────

  describe('✅ Validation réussie', () => {

    it('valide une fiche SOUMISE → VALIDEE', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheValideeResult)

      // ACT
      const result = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      )

      // ASSERT
      expect(result.statut).toBe('VALIDEE')
      expect(result.validateurId).toBe('igt-001')
    })

    it('enregistre le validateurId lors de la validation', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheValideeResult)

      // ACT
      await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      )

      // ASSERT — traçabilité : qui a validé
      expect(mockFicheRepository.updateStatut).toHaveBeenCalledWith(
        'fiche-001',
        expect.objectContaining({
          statut: 'VALIDEE',
          validateurId: 'igt-001'
        })
      )
    })
  })

  // ── REJET ─────────────────────────────────────────────────────────────────────

  describe('✅ Rejet réussi', () => {

    it('rejette une fiche SOUMISE → REJETEE avec motif', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheRejeteeResult)

      // ACT
      const result = await validerFicheUseCase(
        {
          ficheId: 'fiche-001',
          action: 'REJETER',
          validateurId: 'igt-001',
          motif: 'Mission 2 : écart Z hors tolérance non documenté'
        },
        mockFicheRepository
      )

      // ASSERT
      expect(result.statut).toBe('REJETEE')
    })

    it('stocke le motif dans les observations', async () => {
      // ARRANGE
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)
      vi.mocked(mockFicheRepository.updateStatut).mockResolvedValue(ficheRejeteeResult)

      const motif = 'Mission 2 : écart Z hors tolérance non documenté'

      // ACT
      await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'REJETER', validateurId: 'igt-001', motif },
        mockFicheRepository
      )

      // ASSERT — motif stocké pour que la brigade voie pourquoi
      expect(mockFicheRepository.updateStatut).toHaveBeenCalledWith(
        'fiche-001',
        expect.objectContaining({
          statut: 'REJETEE',
          observations: motif
        })
      )
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la fiche n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(null)

      await expect(
        validerFicheUseCase(
          { ficheId: 'fiche-inexistante', action: 'VALIDER', validateurId: 'igt-001' },
          mockFicheRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance AppError STATUT_INVALIDE si fiche BROUILLON', async () => {
      // SCÉNARIO : IGT essaie de valider une fiche pas encore soumise
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      const erreur = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche déjà VALIDEE', async () => {
      // SCÉNARIO : fiche déjà validée — immuable
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheValidee)

      const erreur = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche REJETEE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheRejetee)

      const erreur = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError MOTIF_REQUIS si rejet sans motif', async () => {
      // SCÉNARIO : IGT rejette sans expliquer pourquoi
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'REJETER', validateurId: 'igt-001' },
        // pas de motif
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('MOTIF_REQUIS')
    })

    it('lance AppError MOTIF_REQUIS si motif vide ou espaces', async () => {
      // SCÉNARIO : motif = "   " → après trim → "" → invalide
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'REJETER', validateurId: 'igt-001', motif: '   ' },
        mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('MOTIF_REQUIS')
    })

    it('ne change pas le statut si erreur', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      await validerFicheUseCase(
        { ficheId: 'fiche-001', action: 'VALIDER', validateurId: 'igt-001' },
        mockFicheRepository
      ).catch(() => {})

      expect(mockFicheRepository.updateStatut).not.toHaveBeenCalled()
    })
  })
})