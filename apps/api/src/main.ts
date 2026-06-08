import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import dotenv from 'dotenv'
import { errorHandler } from './interfaces/error-handler.js'
import { authRoutes } from './interfaces/routes/auth.routes.js'

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

app.get('/health', async () => ({
  status: 'ok',
  project: 'GeoGSC Monitoring',
  timestamp: new Date().toISOString()
}))

const port = Number(process.env.PORT) || 3000
await app.listen({ port, host: '0.0.0.0' })