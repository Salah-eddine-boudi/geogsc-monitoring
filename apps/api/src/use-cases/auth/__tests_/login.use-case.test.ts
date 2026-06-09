/**
 * @file login.use-case.test.ts
 * @description Tests unitaires du use-case Login.
 *
 * PRINCIPE DES TESTS UNITAIRES :
 * - On teste UNE seule chose à la fois
 * - On isole complètement les dépendances externes (BDD, JWT)
 * - On utilise des "mocks" — des fausses implémentations contrôlées
 * - Aucune connexion BDD réelle → tests ultra rapides (millisecondes)
 *
 * STRUCTURE AAA (Arrange, Act, Assert) :
 * - Arrange : prépare les données et les mocks
 * - Act     : appelle la fonction testée
 * - Assert  : vérifie le résultat
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import { loginUseCase } from '../login.use-case.js'
import { UnauthorizedError } from '../../../domain/errors.js'
import type { IUserRepository } from '../../../domain/repositories/user.repository.js'
import type { UserEntity } from '../../../domain/entities/user.entity.js'

// ─── MOCK USER ────────────────────────────────────────────────────────────────

/**
 * Utilisateur fictif pour les tests.
 * Représente un utilisateur Brigade valide en BDD.
 */
const mockUser: UserEntity = {
  id: 'user-test-123',
  nom: 'AIT KADIR',
  prenom: 'Marouane',
  email: 'brigade1@geocoding.ma',
  password: await bcrypt.hash('password123', 10), // hash réel bcrypt
  role: 'BRIGADE',
  brigadeId: 'brigade-01',
  actif: true,
  createdAt: new Date()
}

// ─── MOCK REPOSITORY ──────────────────────────────────────────────────────────

/**
 * Faux repository — remplace Prisma pendant les tests.
 * vi.fn() crée une fonction espion qu'on peut configurer.
 */
const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn(),
  findById: vi.fn()
}

// ─── MOCK JWT ─────────────────────────────────────────────────────────────────

/**
 * Fausse fonction de signature JWT.
 * En vrai elle appellerait Fastify — ici on retourne un token fictif.
 */
const mockSignJwt = vi.fn().mockReturnValue('fake-jwt-token')

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('loginUseCase', () => {

  // Réinitialise les mocks avant chaque test
  // Évite que les appels d'un test influencent le suivant
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── CAS NOMINAL ─────────────────────────────────────────────────────────────

  describe('✅ Cas nominal — login réussi', () => {

    it('retourne un token et les infos user quand les credentials sont valides', async () => {
      // ARRANGE — configure le mock pour retourner notre utilisateur fictif
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

      // ACT — appelle le use-case avec des credentials valides
      const result = await loginUseCase(
        { email: 'brigade1@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      )

      // ASSERT — vérifie que le résultat est correct
      expect(result.token).toBe('fake-jwt-token')
      expect(result.user.id).toBe('user-test-123')
      expect(result.user.email).toBe('brigade1@geocoding.ma')
      expect(result.user.role).toBe('BRIGADE')
      expect(result.user.brigadeId).toBe('brigade-01')
    })

    it('appelle findByEmail avec le bon email', async () => {
      // ARRANGE
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

      // ACT
      await loginUseCase(
        { email: 'brigade1@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      )

      // ASSERT — vérifie que le repository a été appelé avec le bon email
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('brigade1@geocoding.ma')
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1)
    })

    it('appelle signJwt avec le bon payload', async () => {
      // ARRANGE
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

      // ACT
      await loginUseCase(
        { email: 'brigade1@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      )

      // ASSERT — vérifie que le JWT contient les bonnes infos
      expect(mockSignJwt).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-test-123',
          email: 'brigade1@geocoding.ma',
          role: 'BRIGADE',
          brigadeId: 'brigade-01'
        })
      )
    })

    it('ne retourne pas le mot de passe dans la réponse', async () => {
      // ARRANGE
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

      // ACT
      const result = await loginUseCase(
        { email: 'brigade1@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      )

      // ASSERT — sécurité : le hash bcrypt ne doit jamais être exposé
      expect(result.user).not.toHaveProperty('password')
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur — credentials invalides', () => {

    it('lance UnauthorizedError si l\'email n\'existe pas en BDD', async () => {
      // ARRANGE — simule un email inexistant
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      // ACT & ASSERT — vérifie que l'erreur est lancée
      await expect(
        loginUseCase(
          { email: 'inexistant@geocoding.ma', password: 'password123' },
          mockUserRepository,
          mockSignJwt
        )
      ).rejects.toThrow(UnauthorizedError)
    })

    it('lance UnauthorizedError si le mot de passe est incorrect', async () => {
      // ARRANGE — utilisateur trouvé mais mauvais mot de passe
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)

      // ACT & ASSERT
      await expect(
        loginUseCase(
          { email: 'brigade1@geocoding.ma', password: 'mauvais-mot-de-passe' },
          mockUserRepository,
          mockSignJwt
        )
      ).rejects.toThrow(UnauthorizedError)
    })

    it('lance UnauthorizedError si le compte est désactivé', async () => {
      // ARRANGE — utilisateur avec actif: false
      const userDesactive: UserEntity = { ...mockUser, actif: false }
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(userDesactive)

      // ACT & ASSERT
      await expect(
        loginUseCase(
          { email: 'brigade1@geocoding.ma', password: 'password123' },
          mockUserRepository,
          mockSignJwt
        )
      ).rejects.toThrow(UnauthorizedError)
    })

    it('ne révèle pas si l\'email existe ou non — même erreur dans les deux cas', async () => {
      // SÉCURITÉ : email inexistant et mauvais mot de passe
      // doivent retourner la MÊME erreur pour ne pas aider un attaquant

      // CAS 1 — email inexistant
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)
      const erreur1 = await loginUseCase(
        { email: 'inexistant@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      ).catch(e => e)

      // CAS 2 — mauvais mot de passe
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(mockUser)
      const erreur2 = await loginUseCase(
        { email: 'brigade1@geocoding.ma', password: 'mauvais' },
        mockUserRepository,
        mockSignJwt
      ).catch(e => e)

      // ASSERT — même type d'erreur, même code
      expect(erreur1).toBeInstanceOf(UnauthorizedError)
      expect(erreur2).toBeInstanceOf(UnauthorizedError)
      expect(erreur1.code).toBe(erreur2.code)
      expect(erreur1.message).toBe(erreur2.message)
    })

    it('ne signe pas de JWT si les credentials sont invalides', async () => {
      // ARRANGE
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null)

      // ACT
      await loginUseCase(
        { email: 'inexistant@geocoding.ma', password: 'password123' },
        mockUserRepository,
        mockSignJwt
      ).catch(() => {})

      // ASSERT — signJwt ne doit JAMAIS être appelé si auth échoue
      expect(mockSignJwt).not.toHaveBeenCalled()
    })
  })
})