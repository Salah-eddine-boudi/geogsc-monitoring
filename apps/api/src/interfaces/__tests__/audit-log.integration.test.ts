/**
 * @file audit-log.integration.test.ts
 * @description Tests D'INTÉGRATION — Routes /audit-logs
 *
 * INTÉGRATION = on teste la stack complète :
 * Requête HTTP → Route Fastify → Use-case → Prisma → BDD geogsc_test
 *
 * DIFFÉRENCE AVEC LES TESTS UNITAIRES :
 * → On utilise une vraie BDD (geogsc_test)
 * → On teste que tout fonctionne ENSEMBLE
 * → Plus lent (~50ms par test) mais plus fiable
 *
 * PRÉREQUIS :
 * → .env.test avec DATABASE_TEST_URL pointant sur geogsc_test
 * → geogsc_test avec toutes les migrations appliquées
 * → pnpm vitest run src/interfaces/__tests__/audit-log.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'

// Routes à tester
import { auditLogRoutes } from '../../interfaces/routes/audit-log.routes.js'
import type { FastifyRequest } from 'fastify'
// Use-case pour créer des logs de test
import {
  createAuditLogUseCase,
  AUDIT_ACTIONS
} from '../../use-cases/audit-log/create-audit-log.use-case.js'

// Prisma pour setup/teardown
import { prisma } from '../../infrastructure/prisma/prisma.js'

// ─── SETUP APP FASTIFY ────────────────────────────────────────────
/**
 * On crée une instance Fastify légère juste pour les tests.
 * Elle n'a que les plugins nécessaires aux routes testées.
 */

let app: ReturnType<typeof Fastify>

// IDs créés pendant les tests — pour nettoyage afterAll
let testUserId: string
let testBrigadeId: string

// Tokens JWT pour simuler les rôles
let tokenIGT: string
let tokenBRIGADE: string

beforeAll(async () => {
  // ── Créer l'app Fastify de test ──────────────────────────────
  app = Fastify({ logger: false })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'test-secret'
  })

  // Plugin auth — vérifie le token JWT
app.addHook('preHandler', async (request: FastifyRequest) => {
  try {
    await request.jwtVerify()
  } catch {
      // Les routes protégées retournent 401 elles-mêmes
    }
  })

  await app.register(auditLogRoutes, { prefix: '/audit-logs' })
  await app.ready()

  // ── Créer des données de test en BDD ────────────────────────
  // Brigade de test
  const brigade = await prisma.brigade.create({
    data: { nom: 'Brigade Audit Test', chef: 'Chef Test' }
  })
  testBrigadeId = brigade.id

  // Utilisateur IGT de test
  const userIGT = await prisma.user.create({
    data: {
      nom:      'TEST',
      prenom:   'IGT',
      email:    'igt-audit-test@test.com',
      password: 'hashed',
      role:     'IGT'
    }
  })
  testUserId = userIGT.id

  // Utilisateur BRIGADE de test
  const userBrigade = await prisma.user.create({
    data: {
      nom:       'TEST',
      prenom:    'Brigade',
      email:     'brigade-audit-test@test.com',
      password:  'hashed',
      role:      'BRIGADE',
      brigadeId: testBrigadeId
    }
  })

  // Générer les tokens JWT
  tokenIGT     = app.jwt.sign({ sub: userIGT.id,     role: 'IGT',     email: userIGT.email })
  tokenBRIGADE = app.jwt.sign({ sub: userBrigade.id, role: 'BRIGADE', email: userBrigade.email })
})

afterAll(async () => {
  // ── Nettoyage — supprimer les données de test ───────────────
  // Ordre important : respecter les FK
  await prisma.auditLog.deleteMany({
    where: { userId: testUserId }
  })
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['igt-audit-test@test.com', 'brigade-audit-test@test.com']
      }
    }
  })
  await prisma.brigade.deleteMany({
    where: { id: testBrigadeId }
  })

  await app.close()
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Nettoyer les logs de test avant chaque test
  // pour éviter que les tests se polluent entre eux
  await prisma.auditLog.deleteMany({
    where: { userId: testUserId }
  })
})

// ─── TESTS ────────────────────────────────────────────────────────

describe('GET /audit-logs', () => {

  // ── TEST 1 ────────────────────────────────────────────────────

  it('retourne 401 sans token', async () => {
    const response = await app.inject({
      method: 'GET',
      url:    '/audit-logs'
      // Pas de headers Authorization
    })

    expect(response.statusCode).toBe(401)
  })

  // ── TEST 2 ────────────────────────────────────────────────────

  it('retourne 403 si rôle BRIGADE', async () => {
    /**
     * SCÉNARIO MÉTIER :
     * Un brigadier ne doit pas pouvoir lire les logs d'audit.
     * Les logs contiennent des infos sensibles sur toutes les équipes.
     */
    const response = await app.inject({
      method:  'GET',
      url:     '/audit-logs',
      headers: { Authorization: `Bearer ${tokenBRIGADE}` }
    })

    expect(response.statusCode).toBe(403)
    const body = response.json()
    expect(response.statusCode).toBe(403)
  })

  // ── TEST 3 ────────────────────────────────────────────────────

  it('retourne liste vide si aucun log', async () => {
    const response = await app.inject({
      method:  'GET',
      url:     '/audit-logs',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
    expect(body.pagination.total).toBe(0)
  })

  // ── TEST 4 ────────────────────────────────────────────────────

  it('retourne les logs créés avec structure correcte', async () => {
    /**
     * ARRANGE — créer 2 logs en BDD directement
     * (sans passer par HTTP — c'est plus rapide pour le setup)
     */
    await createAuditLogUseCase({
      action:   AUDIT_ACTIONS.VALIDER_FICHE,
      entite:   'FicheJournaliere',
      entiteId: 'fiche-test-001',
      userId:   testUserId,
      meta:     { ancienStatut: 'SOUMISE', nouveauStatut: 'VALIDEE' }
    })

    await createAuditLogUseCase({
      action:   AUDIT_ACTIONS.CREATE_MISSION,
      entite:   'Mission',
      entiteId: 'mission-test-001',
      userId:   testUserId
    })

    // ACT
    const response = await app.inject({
      method:  'GET',
      url:     '/audit-logs',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    // ASSERT
    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.pagination.total).toBe(2)

    // Vérifier la structure d'un log
    const premierLog = body.data[0]  // plus récent en premier
    expect(premierLog).toHaveProperty('id')
    expect(premierLog).toHaveProperty('action')
    expect(premierLog).toHaveProperty('entite')
    expect(premierLog).toHaveProperty('entiteId')
    expect(premierLog).toHaveProperty('createdAt')
    expect(premierLog).toHaveProperty('user')
    expect(premierLog.user).toHaveProperty('nom')
    expect(premierLog.user).toHaveProperty('prenom')
  })

  // ── TEST 5 ────────────────────────────────────────────────────

  it('filtre par action', async () => {
    /**
     * SCÉNARIO MÉTIER :
     * L'IGT veut voir uniquement les validations de fiches.
     * GET /audit-logs?action=VALIDER_FICHE
     */
    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.VALIDER_FICHE,
      entite: 'FicheJournaliere',
      entiteId: 'fiche-001',
      userId: testUserId
    })
    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.REJETER_FICHE,
      entite: 'FicheJournaliere',
      entiteId: 'fiche-002',
      userId: testUserId
    })
    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.LOGIN,
      entite: 'User',
      entiteId: testUserId,
      userId: testUserId
    })

    const response = await app.inject({
      method:  'GET',
      url:     '/audit-logs?action=VALIDER_FICHE',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    // Seul le log VALIDER_FICHE doit apparaître
    expect(body.data).toHaveLength(1)
    expect(body.data[0].action).toBe('VALIDER_FICHE')
  })

  // ── TEST 6 ────────────────────────────────────────────────────

  it('filtre par entiteId', async () => {
    /**
     * SCÉNARIO MÉTIER :
     * L'IGT veut voir l'historique complet d'une fiche précise.
     * GET /audit-logs?entiteId=fiche-xyz
     */
    const ficheId = 'fiche-specifique-xyz'

    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.CREATE_FICHE,
      entite: 'FicheJournaliere',
      entiteId: ficheId,
      userId: testUserId
    })
    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.SOUMETTRE_FICHE,
      entite: 'FicheJournaliere',
      entiteId: ficheId,
      userId: testUserId
    })
    // Log d'une autre fiche — ne doit PAS apparaître
    await createAuditLogUseCase({
      action: AUDIT_ACTIONS.VALIDER_FICHE,
      entite: 'FicheJournaliere',
      entiteId: 'autre-fiche-abc',
      userId: testUserId
    })

    const response = await app.inject({
      method:  'GET',
      url:     `/audit-logs?entiteId=${ficheId}`,
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toHaveLength(2)
    body.data.forEach((log: any) => {
      expect(log.entiteId).toBe(ficheId)
    })
  })

  // ── TEST 7 ────────────────────────────────────────────────────

  it('pagination fonctionne correctement', async () => {
    /**
     * Créer 5 logs, demander limit=2 page=1 puis page=2
     */
    for (let i = 0; i < 5; i++) {
      await createAuditLogUseCase({
        action:   AUDIT_ACTIONS.LOGIN,
        entite:   'User',
        entiteId: testUserId,
        userId:   testUserId,
        meta:     { iteration: i }
      })
    }

    // Page 1 — 2 résultats
    const page1 = await app.inject({
      method:  'GET',
      url:     '/audit-logs?limit=2&page=1',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })
    const body1 = page1.json()
    expect(body1.data).toHaveLength(2)
    expect(body1.pagination.total).toBe(5)
    expect(body1.pagination.totalPages).toBe(3)

    // Page 2 — 2 résultats
    const page2 = await app.inject({
      method:  'GET',
      url:     '/audit-logs?limit=2&page=2',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })
    const body2 = page2.json()
    expect(body2.data).toHaveLength(2)

    // Page 3 — 1 résultat
    const page3 = await app.inject({
      method:  'GET',
      url:     '/audit-logs?limit=2&page=3',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })
    const body3 = page3.json()
    expect(body3.data).toHaveLength(1)
  })

  // ── TEST 8 ────────────────────────────────────────────────────

  it('retourne 400 si paramètre dateDebut invalide', async () => {
    /**
     * dateDebut doit être au format YYYY-MM-DD
     * "01/06/2026" est invalide → 400
     */
    const response = await app.inject({
      method:  'GET',
      url:     '/audit-logs?dateDebut=01/06/2026',
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(400)
    const body = response.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })
})

// ─── TESTS ROUTE /entite/:entiteId ────────────────────────────────

describe('GET /audit-logs/entite/:entiteId', () => {

  it('retourne les logs d\'une entité spécifique', async () => {
    const ficheId = 'fiche-entite-test-001'

    await createAuditLogUseCase({
      action:   AUDIT_ACTIONS.SOUMETTRE_FICHE,
      entite:   'FicheJournaliere',
      entiteId: ficheId,
      userId:   testUserId
    })

    const response = await app.inject({
      method:  'GET',
      url:     `/audit-logs/entite/${ficheId}`,
      headers: { Authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].entiteId).toBe(ficheId)
    expect(body.data[0].action).toBe('SOUMETTRE_FICHE')
  })
})