import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import dotenv from 'dotenv'
import { errorHandler } from './interfaces/error-handler.js'
import { authRoutes } from './interfaces/routes/auth.routes.js'
import { brigadesRoutes } from './interfaces/routes/brigades.routes.js'
import { fichesRoutes } from './interfaces/routes/fiches.routes.js'
import { missionsRoutes } from './interfaces/routes/missions.routes.js'
import { controlesRoutes } from './interfaces/routes/controles.routes.js'
import { ouvragesRoutes } from './interfaces/routes/ouvrages.routes.js'

dotenv.config()

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
})

await app.register(helmet)
await app.register(cors, { origin: 'http://localhost:5173' })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret' })

app.setErrorHandler(errorHandler)

await app.register(authRoutes, { prefix: '/auth' })
await app.register(brigadesRoutes, { prefix: '/brigades' })
await app.register(fichesRoutes, { prefix: '/fiches' })
await app.register(missionsRoutes, { prefix: '/fiches/:ficheId/missions' })
await app.register(controlesRoutes, { prefix: '/fiches/:ficheId/missions/:missionId/controles' })
await app.register(ouvragesRoutes, { prefix: '/ouvrages' })

app.get('/health', async () => ({
  status: 'ok',
  project: 'GeoGSC Monitoring',
  timestamp: new Date().toISOString()
}))

const port = Number(process.env.PORT) || 3000
await app.listen({ port, host: '0.0.0.0' })