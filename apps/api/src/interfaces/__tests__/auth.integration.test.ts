/**
 * @file auth.integration.test.ts
 * @description Tests d'intégration — routes Auth.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { authRoutes } from '../routes/auth.routes.js'
import { errorHandler } from '../error-handler.js'


// ─── SETUP ────────────────────────────────────────────────────────────────────

/**
 * Instance Prisma connectée à la BDD de TEST.
 * DATABASE_TEST_URL doit être dans .env.test
 */
    const prisma = new PrismaClient()

/**
 * Instance Fastify de test.
 * Même config que main.ts mais sans le logger pour des logs propres.
 */
const buildApp = async () => {
  const app = Fastify({ logger: false })
  // logger: false → pas de logs dans les tests → output propre

  await app.register(helmet)
  await app.register(cors)
  await app.register(jwt, { secret: 'test-secret' })
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes, { prefix: '/auth' })

  return app
}

// Variables partagées entre les tests
let app: Awaited<ReturnType<typeof buildApp>> //let a la place de const car on l'initialise dans beforeAll
let tokenIGT: string
let tokenBrigade: string

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────


beforeAll(async () => {
  app = await buildApp()

  // Crée les données de test en BDD
  const passwordHash = await bcrypt.hash('password123', 10)

  // Brigade de test
  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade Test' },
    update: {},
    create: { nom: 'Brigade Test', chef: 'Chef Test' }
  })

  // Utilisateur IGT de test
  await prisma.user.upsert({
    where: { email: 'igt-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST',
      prenom: 'IGT',
      email: 'igt-test@geocoding.ma',
      password: passwordHash,
      role: 'IGT'
    }
  })

  // Utilisateur Brigade de test
  await prisma.user.upsert({
    where: { email: 'brigade-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST',
      prenom: 'Brigade',
      email: 'brigade-test@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade.id
    }
  })
})

/**
 * afterAll → s'exécute UNE FOIS après tous les tests.
 * On nettoie et on ferme les connexions.
 */
afterAll(async () => {
  // Nettoie les données de test
  await prisma.user.deleteMany({
    where: { email: { in: ['igt-test@geocoding.ma', 'brigade-test@geocoding.ma'] } }
  })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Test' } })

  // Ferme les connexions
  await prisma.$disconnect()
  await app.close()
})

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {

  describe('✅ Login réussi', () => {

    it('retourne 200 + token pour IGT valide', async () => {
      // ACT — requête HTTP réelle via Fastify inject
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'igt-test@geocoding.ma',
          password: 'password123'
        }
      })
      // app.inject() simule une vraie requête HTTP sans ouvrir de port réseau
      // Avantage : pas besoin de démarrer le serveur sur un port

      // ASSERT
      expect(response.statusCode).toBe(200)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.token).toBeDefined()
      expect(typeof body.token).toBe('string')
      expect(body.user.email).toBe('igt-test@geocoding.ma')
      expect(body.user.role).toBe('IGT')

      // Sauvegarde le token pour les tests suivants
      tokenIGT = body.token
    })

    it('retourne 200 + token pour Brigade valide', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'brigade-test@geocoding.ma',
          password: 'password123'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.user.role).toBe('BRIGADE')
      expect(body.user.brigadeId).toBeDefined()

      tokenBrigade = body.token
    })

    it('ne retourne pas le mot de passe', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'igt-test@geocoding.ma', password: 'password123' }
      })

      const body = response.json()
      // Sécurité critique : jamais exposer le hash bcrypt
      expect(body.user).not.toHaveProperty('password')
    })
  })

  describe('❌ Login échoué', () => {

    it('retourne 401 pour mauvais mot de passe', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'igt-test@geocoding.ma', password: 'mauvais' }
      })

      expect(response.statusCode).toBe(401)
      const body = response.json()
      expect(body.code).toBe('UNAUTHORIZED')
    })

    it('retourne 401 pour email inexistant', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'inexistant@geocoding.ma', password: 'password123' }
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 400 pour email invalide', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'pasunemail', password: 'password123' }
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.code).toBe('VALIDATION_ERROR')
    })

    it('retourne 400 si body manquant', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {}
      })

      expect(response.statusCode).toBe(400)
    })

    it('même erreur pour email inexistant et mauvais mdp', async () => {
      // SÉCURITÉ : ne pas révéler si l'email existe

      const response1 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'inexistant@geocoding.ma', password: 'password123' }
      })

      const response2 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'igt-test@geocoding.ma', password: 'mauvais' }
      })

      // Même status et même code d'erreur
      expect(response1.statusCode).toBe(response2.statusCode)
      expect(response1.json().code).toBe(response2.json().code)
    })
  })
})

describe('GET /auth/me', () => {

  describe('✅ Profil connecté', () => {

    it('retourne 200 + profil pour token IGT valide', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          // Authorization: Bearer <token>
          // C'est comme ça que le frontend envoie le token
          authorization: `Bearer ${tokenIGT}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.user.email).toBe('igt-test@geocoding.ma')
      expect(body.user.role).toBe('IGT')
      expect(body.user).not.toHaveProperty('password')
    })

    it('retourne brigadeId pour utilisateur Brigade', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: `Bearer ${tokenBrigade}` }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.user.brigadeId).toBeDefined()
    })
  })

  describe('❌ Sans token', () => {

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me'
        // pas de header authorization
      })

      expect(response.statusCode).toBe(401)
      expect(response.json().code).toBe('UNAUTHORIZED')
    })

    it('retourne 401 avec token invalide', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: 'Bearer token-invalide' }
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 401 avec token malformé', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: { authorization: 'pas-un-bearer-token' }
      })

      expect(response.statusCode).toBe(401)
    })
  })
})