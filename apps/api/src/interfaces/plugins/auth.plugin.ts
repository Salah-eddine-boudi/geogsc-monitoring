import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError, ForbiddenError } from '../../domain/errors.js'

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError()
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply)
    const payload = request.user as { role: string }
    if (!roles.includes(payload.role)) {
      throw new ForbiddenError()
    }
  }
}