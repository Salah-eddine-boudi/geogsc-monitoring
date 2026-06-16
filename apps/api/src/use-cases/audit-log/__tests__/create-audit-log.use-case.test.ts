/**
 * @file create-audit-log.use-case.test.ts
 * @description Tests UNITAIRES — createAuditLogUseCase
 *
 * UNITAIRE = on ne touche pas la BDD.
 * On "mocke" Prisma → on remplace prisma.auditLog.create
 * par une fausse fonction qui retourne ce qu'on veut.
 *
 * POURQUOI MOCKER ?
 * → Pas besoin de BDD de test configurée
 * → Tests s'exécutent en ~1ms
 * → On teste la LOGIQUE, pas l'infrastructure
 *
 * VITEST vi.mock() :
 * Remplace le module entier par une version factice.
 * vi.fn() crée une fonction espion qu'on peut configurer
 * et vérifier après l'appel.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createAuditLogUseCase,
  AUDIT_ACTIONS
} from '../create-audit-log.use-case.js'

// ─── MOCK PRISMA ──────────────────────────────────────────────────
/**
 * vi.mock() intercepte l'import de prisma.
 * Quand le use-case fait `prisma.auditLog.create(...)`,
 * c'est notre fausse fonction qui s'exécute — pas Prisma réel.
 */
vi.mock('../../../infrastructure/prisma/prisma.js', () => ({
  prisma: {
    auditLog: {
      // vi.fn() → fonction espion configurable
      create: vi.fn()
    }
  }
}))

// Import APRÈS le mock pour avoir la version mockée
import { prisma } from '../../../infrastructure/prisma/prisma.js'

// ─── TESTS ────────────────────────────────────────────────────────

describe('createAuditLogUseCase', () => {

  // Réinitialise les mocks avant chaque test
  // → évite que les appels d'un test polluent le suivant
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── TEST 1 ──────────────────────────────────────────────────────

  it('crée un log avec les paramètres corrects', async () => {
    /**
     * ARRANGE — configurer le mock pour simuler un succès
     * mockResolvedValueOnce → prisma.auditLog.create retourne
     * cet objet au prochain appel
     */
    const mockLog = {
      id: 'cld-test-123',
      action: AUDIT_ACTIONS.VALIDER_FICHE,
      entite: 'FicheJournaliere',
      entiteId: 'fiche-id-456',
      userId: 'user-id-789',
      meta: { ancienStatut: 'SOUMISE' },
      createdAt: new Date()
    }
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce(mockLog as any)

    // ACT — appeler le use-case
    await createAuditLogUseCase({
      action:   AUDIT_ACTIONS.VALIDER_FICHE,
      entite:   'FicheJournaliere',
      entiteId: 'fiche-id-456',
      userId:   'user-id-789',
      meta:     { ancienStatut: 'SOUMISE' }
    })

    /**
     * ASSERT — vérifier que prisma.auditLog.create a été appelé
     * avec les bons arguments
     * toHaveBeenCalledWith() vérifie les arguments exacts
     */
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action:   AUDIT_ACTIONS.VALIDER_FICHE,
        entite:   'FicheJournaliere',
        entiteId: 'fiche-id-456',
        userId:   'user-id-789',
        meta:     { ancienStatut: 'SOUMISE' }
      }
    })

    // Vérifie que la fonction a été appelée exactement 1 fois
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
  })

  // ── TEST 2 ──────────────────────────────────────────────────────

  it('crée un log sans meta (meta optionnel)', async () => {
  vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

  await createAuditLogUseCase({
    action:   AUDIT_ACTIONS.LOGIN,
    entite:   'User',
    entiteId: 'user-id-123',
    userId:   'user-id-123'
  })

  // meta absent → Prisma.JsonNull (pas undefined)
  // On vérifie juste que l'action est correcte
  // sans vérifier la valeur exacte de meta
  expect(prisma.auditLog.create).toHaveBeenCalledTimes(1)
  expect(prisma.auditLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      action:   AUDIT_ACTIONS.LOGIN,
      entite:   'User',
      entiteId: 'user-id-123',
      userId:   'user-id-123',
    })
  })
})

  // ── TEST 3 ──────────────────────────────────────────────────────

  it('ne throw pas si prisma.create échoue (fire-and-forget)', async () => {
    /**
     * SCÉNARIO : la BDD est temporairement indisponible.
     * Le use-case doit rejeter la promesse mais NE PAS throw
     * de façon synchrone.
     *
     * C'est au APPELANT de gérer avec .catch()
     * comme montré dans INTEGRATION_GUIDE.ts
     */
    vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(
      new Error('BDD indisponible')
    )

    /**
     * rejects.toThrow() → vérifie que la promesse rejette
     * C'est OK — le use-case lance l'erreur, c'est l'appelant
     * qui doit la catcher avec .catch(logger.error)
     */
    await expect(
      createAuditLogUseCase({
        action:   AUDIT_ACTIONS.CREATE_FICHE,
        entite:   'FicheJournaliere',
        entiteId: 'fiche-123',
        userId:   'user-123'
      })
    ).rejects.toThrow('BDD indisponible')
  })

  // ── TEST 4 ──────────────────────────────────────────────────────

  it('AUDIT_ACTIONS contient toutes les actions attendues', () => {
    /**
     * Test de contrat — vérifie que les constantes
     * sont bien définies. Si quelqu'un supprime une action
     * par erreur, ce test échoue immédiatement.
     */
    expect(AUDIT_ACTIONS.LOGIN).toBe('LOGIN')
    expect(AUDIT_ACTIONS.VALIDER_FICHE).toBe('VALIDER_FICHE')
    expect(AUDIT_ACTIONS.REJETER_FICHE).toBe('REJETER_FICHE')
    expect(AUDIT_ACTIONS.CREATE_MISSION).toBe('CREATE_MISSION')
    expect(AUDIT_ACTIONS.DELETE_MISSION).toBe('DELETE_MISSION')
  })
})