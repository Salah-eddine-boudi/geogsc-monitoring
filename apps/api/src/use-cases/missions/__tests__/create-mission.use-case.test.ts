/**
 * @file create-mission.use-case.test.ts
 * @description Tests unitaires — création d'une réception (mission).
 *
 * NB: le terme interne reste "mission" dans le code.
 *     L'affichage "Réception" est uniquement côté UI.
 *
 * CE QU'ON TESTE :
 * ✅ Création réussie dans une fiche BROUILLON — champs minimaux
 * ✅ Création réussie avec tous les champs CDC v2
 * ✅ IGT peut créer dans n'importe quelle fiche
 * ❌ Fiche inexistante → NotFoundError
 * ❌ Fiche d'une autre brigade → ForbiddenError
 * ❌ Fiche non BROUILLON (SOUMISE) → AppError STATUT_INVALIDE
 * ❌ Fiche non BROUILLON (VALIDEE) → AppError STATUT_INVALIDE
 * ❌ Ouvrage inexistant → NotFoundError
 * ❌ Ouvrage inactif → NotFoundError
 * ✅ repository.create() n'est pas appelé si fiche SOUMISE
 *
 * COMMANDES POUR LANCER UNIQUEMENT CE FICHIER :
 *
 *   # Depuis la racine du monorepo
 *   pnpm --filter api test:unit -- create-mission
 *
 *   # Depuis apps/api directement
 *   cd apps/api
 *   pnpm vitest run src/use-cases/missions/__tests__/create-mission.use-case.test.ts
 *
 *   # Mode watch (relance à chaque sauvegarde)
 *   pnpm vitest src/use-cases/missions/__tests__/create-mission.use-case.test.ts
 *
 *   # Avec coverage sur ce fichier uniquement
 *   pnpm vitest run --coverage src/use-cases/missions/__tests__/create-mission.use-case.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMissionUseCase } from '../create-mission.use-case.js'
import { NotFoundError, ForbiddenError, AppError } from '../../../domain/errors.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { IOuvrageRepository } from '../../../domain/repositories/ouvrage.repository.js'
import type { FicheWithRelations } from '../../../domain/entities/fiche.entity.js'
import type { OuvrageEntity } from '../../../domain/entities/ouvrage.entity.js'
import type { MissionEntity } from '../../../domain/entities/mission.entity.js'

// ─── FIXTURES ─────────────────────────────────────────────────────────────────
// Données de test stables — réutilisées dans tous les tests.
// Ne pas modifier entre les tests (beforeEach remet les mocks à zéro).

const ficheBrouillon: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date('2026-06-09'),
  statut: 'BROUILLON',
  observations: null,
  conditionMeteo: 'BEAU',
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  brigade:  { id: 'brigade-01', nom: 'Équipe Nord', chef: 'M. AALLAOUI' },
  createur: { id: 'user-001', nom: 'AALLAOUI', prenom: 'Youssef' },
  validateur: null,
  missions: [],
  _count: { missions: 0 },
}

const ficheSoumise: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'SOUMISE',
}

const ficheValidee: FicheWithRelations = {
  ...ficheBrouillon,
  statut: 'VALIDEE',
}

const ficheAutreBrigade: FicheWithRelations = {
  ...ficheBrouillon,
  brigadeId: 'brigade-99', // brigade différente
}

const ouvrageActif: OuvrageEntity = {
  id: 'ouvrage-001',
  reference: 'PLT-A-01',
  designation: 'Platine charpente axe A-01',
  type: 'PLATINE',
  axe: 'Axe A',
  niveau: 'R+1',
  actif: true,
  createdAt: new Date(),
}

const ouvrageInactif: OuvrageEntity = {
  ...ouvrageActif,
  actif: false,
}

// Mission retournée par le mock repository après création réussie
const missionCreee: MissionEntity = {
  id: 'mission-001',
  statut: 'PLANIFIEE',
  heureDebut: null,
  heureFin: null,
  // Localisation
  zone: 'A',
  sousZone: null,
  axe: 'A14',
  fil: 'H-J',
  niveau: 'RDC',
  partieOuvrage: 'Crémaillère inf. Axe A14/A16',
  // Intervention
  nature: 'RECEPTION_AVANT_BETONNAGE',
  appareil: null,
  provenanceAppareil: 'GEOCODING',
  nomAppareil: null,
  travailRealise: null,
  stadeCollage: 'PREMIER_COLLAGE',
  periode: 'JOUR',
  ecartMm: null,
  // Résultat
  resultat: null,
  observationsNc: null,
  observations: null,
  // Références
  ficheId: 'fiche-001',
  ouvrageId: 'ouvrage-001',
  typeOuvrage: 'CREMAILLERE_INF',
  categorieAssainissement: null,
  ficheReference: null,
  // Audit
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── MOCKS REPOSITORIES ───────────────────────────────────────────────────────

const mockMissionRepository: IMissionRepository = {
  findByFiche: vi.fn(),
  findById:    vi.fn(),
  create:      vi.fn(),
  update:      vi.fn(),
  delete:      vi.fn(),
}

const mockFicheRepository: IFicheRepository = {
  findAll:            vi.fn(),
  findById:           vi.fn(),
  findByBrigadeAndDate: vi.fn(),
  create:             vi.fn(),
  update:             vi.fn(),
  updateStatut:       vi.fn(),
}

const mockOuvrageRepository: IOuvrageRepository = {
  findAll:          vi.fn(),
  findById:         vi.fn(),
  findByReference:  vi.fn(),
}

// Reset tous les mocks avant chaque test — garantit l'isolation
beforeEach(() => vi.clearAllMocks())

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('createMissionUseCase', () => {

  // ════════════════════════════════════════════════════════════════════════════
  // CAS NOMINAUX ✅
  // ════════════════════════════════════════════════════════════════════════════

  describe('Création réussie', () => {

    it('crée une mission en statut PLANIFIEE avec champs minimaux', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      const result = await createMissionUseCase(
        {
          ficheId:       'fiche-001',
          ouvrageId:     'ouvrage-001',
          userBrigadeId: 'brigade-01',
          userRole:      'BRIGADE',
        },
        mockMissionRepository,
        mockFicheRepository,
        mockOuvrageRepository
      )

      expect(result.statut).toBe('PLANIFIEE')
      expect(result.ficheId).toBe('fiche-001')
      expect(result.ouvrageId).toBe('ouvrage-001')
      expect(result.heureDebut).toBeNull()
      expect(result.heureFin).toBeNull()
    })

    it('crée une mission avec tous les champs CDC v2', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      await createMissionUseCase(
        {
          ficheId:       'fiche-001',
          ouvrageId:     'ouvrage-001',
          userBrigadeId: 'brigade-01',
          userRole:      'BRIGADE',
          // §2 Localisation
          zone:          'A',
          sousZone:      'Tribune inf.',
          axe:           'A14',
          fil:           'H-J',
          niveau:        'RDC',
          partieOuvrage: 'Crémaillère inf. Axe A14/A16',
          // §3 Intervention
          nature:             'RECEPTION_AVANT_BETONNAGE',
          stadeCollage:       'PREMIER_COLLAGE',
          provenanceAppareil: 'GEOCODING',
          nomAppareil:        'Station Leica TS16 N°2',
          periode:            'JOUR',
          ecartMm:            8,
          travailRealise:     'Réception crémaillère avant bétonnage',
          // §4 Résultat
          typeOuvrage:     'CREMAILLERE_INF',
          observations:    'RAS',
        },
        mockMissionRepository,
        mockFicheRepository,
        mockOuvrageRepository
      )

      // Vérifie que create() est appelé avec les bons champs
      expect(mockMissionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ficheId:            'fiche-001',
          ouvrageId:          'ouvrage-001',
          zone:               'A',
          sousZone:           'Tribune inf.',
          axe:                'A14',
          fil:                'H-J',
          nature:             'RECEPTION_AVANT_BETONNAGE',
          stadeCollage:       'PREMIER_COLLAGE',
          provenanceAppareil: 'GEOCODING',
          nomAppareil:        'Station Leica TS16 N°2',
          periode:            'JOUR',
          ecartMm:            8,
          typeOuvrage:        'CREMAILLERE_INF',
        })
      )
    })

    it('IGT peut créer une mission dans n\'importe quelle fiche (pas de cloisonnement brigade)', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      // IGT : userBrigadeId = undefined, userRole = 'IGT'
      await expect(
        createMissionUseCase(
          {
            ficheId:       'fiche-001',
            ouvrageId:     'ouvrage-001',
            userBrigadeId: undefined,
            userRole:      'IGT',
          },
          mockMissionRepository,
          mockFicheRepository,
          mockOuvrageRepository
        )
      ).resolves.toBeDefined()
    })

    it('ADMIN peut créer une mission dans n\'importe quelle fiche', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      await expect(
        createMissionUseCase(
          {
            ficheId:       'fiche-001',
            ouvrageId:     'ouvrage-001',
            userBrigadeId: undefined,
            userRole:      'ADMIN',
          },
          mockMissionRepository,
          mockFicheRepository,
          mockOuvrageRepository
        )
      ).resolves.toBeDefined()
    })

    it('appelle findById sur fiche ET ouvrage', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageActif)
      vi.mocked(mockMissionRepository.create).mockResolvedValue(missionCreee)

      await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      )

      expect(mockFicheRepository.findById).toHaveBeenCalledWith('fiche-001')
      expect(mockFicheRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockOuvrageRepository.findById).toHaveBeenCalledWith('ouvrage-001')
      expect(mockOuvrageRepository.findById).toHaveBeenCalledTimes(1)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // CAS D'ERREUR ❌
  // ════════════════════════════════════════════════════════════════════════════

  describe('Cas d\'erreur', () => {

    it('lance NotFoundError si la fiche n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(null)

      await expect(
        createMissionUseCase(
          {
            ficheId: 'fiche-inexistante', ouvrageId: 'ouvrage-001',
            userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
          },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance ForbiddenError si Brigade essaie d\'accéder à une fiche d\'une autre brigade', async () => {
      // ficheBrouillon.brigadeId = 'brigade-01', userBrigadeId = 'brigade-02' → interdit
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheAutreBrigade)

      await expect(
        createMissionUseCase(
          {
            ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
            userBrigadeId: 'brigade-02', userRole: 'BRIGADE',
          },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('lance AppError STATUT_INVALIDE si fiche est SOUMISE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const err = await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch((e) => e)

      expect(err).toBeInstanceOf(AppError)
      expect(err.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche est VALIDEE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheValidee)

      const err = await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch((e) => e)

      expect(err).toBeInstanceOf(AppError)
      expect(err.code).toBe('STATUT_INVALIDE')
    })

    it('lance NotFoundError si l\'ouvrage n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(null)

      await expect(
        createMissionUseCase(
          {
            ficheId: 'fiche-001', ouvrageId: 'ouvrage-inexistant',
            userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
          },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance NotFoundError si l\'ouvrage est inactif', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageInactif)

      await expect(
        createMissionUseCase(
          {
            ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
            userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
          },
          mockMissionRepository, mockFicheRepository, mockOuvrageRepository
        )
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // ISOLATION — repository.create() ne doit pas être appelé sur erreur
  // ════════════════════════════════════════════════════════════════════════════

  describe('Isolation — pas d\'appel BDD sur erreur', () => {

    it('ne crée pas en BDD si la fiche est SOUMISE', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(() => {})

      expect(mockMissionRepository.create).not.toHaveBeenCalled()
    })

    it('ne crée pas en BDD si la fiche n\'existe pas', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(null)

      await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(() => {})

      expect(mockMissionRepository.create).not.toHaveBeenCalled()
    })

    it('ne crée pas en BDD si accès interdit (mauvaise brigade)', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheAutreBrigade)

      await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-02', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(() => {})

      expect(mockMissionRepository.create).not.toHaveBeenCalled()
    })

    it('ne crée pas en BDD si l\'ouvrage est inactif', async () => {
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockOuvrageRepository.findById).mockResolvedValue(ouvrageInactif)

      await createMissionUseCase(
        {
          ficheId: 'fiche-001', ouvrageId: 'ouvrage-001',
          userBrigadeId: 'brigade-01', userRole: 'BRIGADE',
        },
        mockMissionRepository, mockFicheRepository, mockOuvrageRepository
      ).catch(() => {})

      expect(mockMissionRepository.create).not.toHaveBeenCalled()
    })
  })
})