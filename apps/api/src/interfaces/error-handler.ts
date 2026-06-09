import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '../domain/errors.js'

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // CAS 1 — Erreur de validation Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      errors: error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
  }

  // CAS 2 — Erreur métier AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message
    })
  }

  // CAS 3 — Erreur inconnue
  request.log.error(error)
  return reply.status(500).send({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Une erreur interne est survenue'
  })
}