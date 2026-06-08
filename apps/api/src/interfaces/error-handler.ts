import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../domain/errors.js'

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
    })
  }

  request.log.error(error)
  return reply.status(500).send({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Erreur interne du serveur',
  })
}