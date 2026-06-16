/**
 * @file controles.integration.test.ts
 * @description Tests d'intégration — routes Contrôles.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { authRoutes } from '../routes/auth.routes.js'
import { fichesRoutes } from '../routes/fiches.routes.js'
import { missionsRoutes } from '../routes/missions.routes.js'
import { controlesRoutes } from '../routes/controles.routes.js'
import { errorHandler } from '../error-handler.js'

const prisma = new PrismaClient()

const buildApp = async () => {
  const app = Fastify({ logger: false })
  await app.register(helmet)
  await app.register(cors)
  await app.register(jwt, { secret: 'test-secret' })
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(fichesRoutes, { prefix: '/fiches' })
  await app.register(missionsRoutes, { prefix: '/fiches/:ficheId/missions' })
  await app.register(controlesRoutes, { prefix: '/fiches/:ficheId/missions/:missionId/controles' })
  return app
}

let app: Awaited<ReturnType<typeof buildApp>>
let tokenBrigade: string
let tokenIGT: string
let ficheId: string
let missionId: string
let controleId: string
let ouvrageId: string

beforeAll(async () => {
  app = await buildApp()
  const passwordHash = await bcrypt.hash('password123', 10)

  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade Controle Test' },
    update: {},
    create: { nom: 'Brigade Controle Test', chef: 'Chef Test' }
  })

  const ouvrage = await prisma.ouvrage.upsert({
    where: { reference: 'CTRL-TEST-001' },
    update: {},
    create: { reference: 'CTRL-TEST-001', designation: 'Ouvrage controle test', type: 'PLATINE', actif: true }
  })
  ouvrageId = ouvrage.id

  await prisma.user.upsert({
    where: { email: 'brigade-ctrl-test@geocoding.ma' },
    update: {},
    create: { nom: 'TEST', prenom: 'Brigade', email: 'brigade-ctrl-test@geocoding.ma', password: passwordHash, role: 'BRIGADE', brigadeId: brigade.id }
  })

  await prisma.user.upsert({
    where: { email: 'igt-ctrl-test@geocoding.ma' },
    update: {},
    create: { nom: 'TEST', prenom: 'IGT', email: 'igt-ctrl-test@geocoding.ma', password: passwordHash, role: 'IGT' }
  })

  const loginBrigade = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'brigade-ctrl-test@geocoding.ma', password: 'password123' } })
  tokenBrigade = loginBrigade.json().token

  const loginIGT = await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'igt-ctrl-test@geocoding.ma', password: 'password123' } })
  tokenIGT = loginIGT.json().token

  const dateFiche = new Date()
  dateFiche.setDate(dateFiche.getDate() + 10)

  const ficheRes = await app.inject({ method: 'POST', url: '/fiches', headers: { authorization: `Bearer ${tokenBrigade}` }, payload: { date: dateFiche.toISOString().split('T')[0] } })
  ficheId = ficheRes.json().fiche.id

  const missionRes = await app.inject({ method: 'POST', url: `/fiches/${ficheId}/missions`, headers: { authorization: `Bearer ${tokenBrigade}` }, payload: { ouvrageId } })
  missionId = missionRes.json().mission.id

  // Démarre la mission
  await app.inject({ method: 'PATCH', url: `/fiches/${ficheId}/missions/${missionId}`, headers: { authorization: `Bearer ${tokenBrigade}` }, payload: { heureDebut: new Date().toISOString() } })
})

afterAll(async () => {
  await prisma.controle.deleteMany({ where: { missionId } })
  await prisma.mission.deleteMany({ where: { ficheId } })
  await prisma.ficheJournaliere.deleteMany({ where: { id: ficheId } })
  await prisma.user.deleteMany({ where: { email: { in: ['brigade-ctrl-test@geocoding.ma', 'igt-ctrl-test@geocoding.ma'] } } })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Controle Test' } })
  await prisma.ouvrage.deleteMany({ where: { reference: 'CTRL-TEST-001' } })
  await prisma.$disconnect()
  await app.close()
})

describe('POST /fiches/:ficheId/missions/:missionId/controles', () => {

  it('crée un contrôle CONFORME automatiquement', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        type: 'IMPLANTATION',
        ecartX: 2, toleranceX: 5,
        ecartY: -1, toleranceY: 5,
        ecartZ: 1, toleranceZ: 3
      }
    })

    expect(response.statusCode).toBe(201)
    const body = response.json()
    expect(body.controle.statut).toBe('CONFORME')
    expect(body.controle.type).toBe('IMPLANTATION')
    controleId = body.controle.id
  })

  it('crée un contrôle NON_CONFORME automatiquement', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        type: 'ALTIMETRIE',
        ecartZ: 8, toleranceZ: 3
        // 8mm > 3mm → NON_CONFORME automatique
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().controle.statut).toBe('NON_CONFORME')
  })

  it('retourne 403 si IGT essaie de créer', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: { type: 'IMPLANTATION' }
    })
    expect(response.statusCode).toBe(403)
  })

  it('retourne 400 si type manquant', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {}
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /fiches/:ficheId/missions/:missionId/controles', () => {

  it('retourne la liste des contrôles', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.controles).toBeInstanceOf(Array)
    expect(body.controles.length).toBeGreaterThan(0)
  })

  it('IGT peut voir les contrôles', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/fiches/${ficheId}/missions/${missionId}/controles`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })
    expect(response.statusCode).toBe(200)
  })
})

describe('PATCH /controles/:id', () => {

  it('recalcule le statut après modification', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/fiches/${ficheId}/missions/${missionId}/controles/${controleId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        ecartZ: 10, toleranceZ: 3
        // 10mm > 3mm → NON_CONFORME
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().controle.statut).toBe('NON_CONFORME')
  })
})