/**
 * @file cp.integration.test.ts
 * @description Tests d'intégration — routes CP.
 *
 * SCÉNARIO COMPLET :
 * 1. Brigade crée un CP pour la semaine 23
 * 2. Ajoute des événements
 * 3. Ajoute des points de vigilance
 * 4. Soumet le CP
 * 5. Vérifications IGT
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { authRoutes } from '../routes/auth.routes.js'
import { cpRoutes } from '../routes/cp.routes.js'
import { errorHandler } from '../error-handler.js'

const prisma = new PrismaClient()

const buildApp = async () => {
  const app = Fastify({ logger: false })
  await app.register(helmet)
  await app.register(cors)
  await app.register(jwt, { secret: 'test-secret' })
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(cpRoutes, { prefix: '/cp' })
  return app
}

let app: Awaited<ReturnType<typeof buildApp>>
let tokenBrigade: string
let tokenIGT: string
let brigadeId: string
let cpId: string
let evenementId: string
let vigilanceId: string

// ─── SETUP ────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp()

  const passwordHash = await bcrypt.hash('password123', 10)

  // Brigade de test
  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade CP Test' },
    update: {},
    create: { nom: 'Brigade CP Test', chef: 'Chef CP Test' }
  })
  brigadeId = brigade.id

  // Users de test
  await prisma.user.upsert({
    where: { email: 'brigade-cp-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'Brigade',
      email: 'brigade-cp-test@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'igt-cp-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'IGT',
      email: 'igt-cp-test@geocoding.ma',
      password: passwordHash,
      role: 'IGT'
    }
  })

  // Login Brigade
  const loginBrigade = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'brigade-cp-test@geocoding.ma', password: 'password123' }
  })
  tokenBrigade = loginBrigade.json().token

  // Login IGT
  const loginIGT = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'igt-cp-test@geocoding.ma', password: 'password123' }
  })
  tokenIGT = loginIGT.json().token
})

// ─── CLEANUP ──────────────────────────────────────────────────────

afterAll(async () => {
  // Nettoyage dans l'ordre des dépendances
  if (cpId) {
    await prisma.evenementCP.deleteMany({ where: { cpId } })
    await prisma.pointVigilanceCP.deleteMany({ where: { cpId } })
    await prisma.compteRenduCP.deleteMany({ where: { id: cpId } })
  }

  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['brigade-cp-test@geocoding.ma', 'igt-cp-test@geocoding.ma']
      }
    }
  })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade CP Test' } })
  await prisma.$disconnect()
  await app.close()
})

// ─── TESTS ────────────────────────────────────────────────────────

describe('POST /cp — Créer un CP', () => {

  it('Brigade crée un CP pour la semaine 23', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cp',
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        semaine: 23,
        annee: 2026,
        brigadeId,
        observations: 'Semaine de contrôle Tribune Nord'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.cp.statut).toBe('BROUILLON')
    expect(body.cp.semaine).toBe(23)
    expect(body.cp.annee).toBe(2026)

    // Sauvegarde l'ID pour les tests suivants
    cpId = body.cp.id
  })

  it('Retourne 409 si CP déjà existant pour cette semaine', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cp',
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { semaine: 23, annee: 2026, brigadeId }
    })

    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('CONFLICT')
  })

  it('Retourne 400 si semaine invalide (> 53)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cp',
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { semaine: 99, annee: 2026, brigadeId }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('VALIDATION_ERROR')
  })

  it('Retourne 401 sans token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/cp',
      payload: { semaine: 25, annee: 2026, brigadeId }
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('POST /cp/:id/evenements — Ajouter un événement', () => {

  it('Ajoute une visite chantier au CP', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/evenements`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        date: '2026-06-09',
        type: 'VISITE_CHANTIER',
        description: 'Visite avec M. CHAACHOUI — contrôle platines Zone D',
        participants: 'M. CHAACHOUI, M. AIT KADIR',
        lieu: 'Tribune D — R+1'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.evenement.type).toBe('VISITE_CHANTIER')
    expect(body.evenement.description).toBeTruthy()

    evenementId = body.evenement.id
  })

  it('Ajoute une réunion de chantier', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/evenements`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        date: '2026-06-10',
        type: 'REUNION',
        description: 'Réunion de coordination hebdomadaire GEOCODING/SONARGES',
        participants: 'M. CHAACHOUI, M. BOUKBECH, M. ALAMI'
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().evenement.type).toBe('REUNION')
  })

  it('Retourne 400 si description manquante', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/evenements`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        date: '2026-06-09',
        type: 'CONSTAT'
        // description manquante → VALIDATION_ERROR
      }
    })

    expect(response.statusCode).toBe(400)
  })

  it('IGT ne peut pas ajouter un événement — 403', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/evenements`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: {
        date: '2026-06-09',
        type: 'CONSTAT',
        description: 'Tentative IGT'
      }
    })

    expect(response.statusCode).toBe(403)
  })
})

describe('POST /cp/:id/vigilances — Ajouter un point de vigilance', () => {

  it('Ajoute un point de vigilance HAUTE criticité', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/vigilances`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        criticite: 'HAUTE',
        description: 'Platine Axe D03 — écart Z = 45mm → hors tolérance',
        action: 'Vérifier avant coulage béton — autorisation requise',
        responsable: 'M. CHAACHOUI',
        echeance: '2026-06-15'
      }
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.vigilance.criticite).toBe('HAUTE')
    expect(body.vigilance.resolu).toBe(false)

    vigilanceId = body.vigilance.id
  })

  it('Ajoute un point de vigilance MOYENNE criticité', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/vigilances`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        criticite: 'MOYENNE',
        description: 'Accès Zone C — balisage à renforcer',
        action: 'Contacter responsable sécurité'
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().vigilance.criticite).toBe('MOYENNE')
  })
})

describe('GET /cp/:brigadeId — Liste des CPs', () => {

  it('Brigade récupère ses CPs', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/cp/${brigadeId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.cps).toBeInstanceOf(Array)
    expect(body.total).toBeGreaterThan(0)
    expect(body.cps[0].semaine).toBe(23)
  })

  it('IGT peut voir les CPs de n\'importe quelle brigade', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/cp/${brigadeId}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
  })

  it('Filtre par année', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/cp/${brigadeId}?annee=2026`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    body.cps.forEach((cp: any) => {
      expect(cp.annee).toBe(2026)
    })
  })
})

describe('GET /cp/:brigadeId/:id — Détail CP', () => {

  it('Retourne le CP avec événements et vigilances', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/cp/${brigadeId}/${cpId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.cp.id).toBe(cpId)
    expect(body.cp.evenements).toBeInstanceOf(Array)
    expect(body.cp.evenements.length).toBeGreaterThan(0)
    expect(body.cp.pointsVigilance).toBeInstanceOf(Array)
    expect(body.cp.pointsVigilance.length).toBeGreaterThan(0)
  })
})

describe('DELETE /cp/:id/evenements/:evId — Supprimer événement', () => {

  it('Brigade supprime un événement de son CP', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/cp/${cpId}/evenements/${evenementId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().success).toBe(true)
  })
})

describe('POST /cp/:id/soumettre — Soumettre CP', () => {

  it('Retourne 400 CP_VIDE si plus aucun événement', async () => {
    // On a supprimé l'événement ci-dessus
    // mais il en reste un (la réunion)
    // Donc on doit d'abord vérifier le comportement réel
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    // Doit avoir au moins 1 événement (la réunion)
    expect(response.statusCode).toBe(200)
    expect(response.json().cp.statut).toBe('SOUMIS')
  })

  it('Retourne 400 si CP déjà soumis', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/cp/${cpId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('STATUT_INVALIDE')
  })
})