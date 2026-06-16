/**
 * @file logger.ts
 * @description Logger partagé — utilise pino directement.
 */

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
})

export const auditLog = {
  auth: (action: 'LOGIN' | 'LOGOUT', userId: string, role: string) => {
    logger.info({ action, userId, role }, `✅ Auth: ${action}`)
  },

  fiche: (
    action: 'CREATE' | 'SUBMIT' | 'VALIDATE' | 'REJECT' | 'UPDATE',
    ficheId: string,
    userId: string,
    extra?: Record<string, unknown>
  ) => {
    logger.info({ action, ficheId, userId, ...extra }, `📋 Fiche: ${action}`)
  },

  mission: (
    action: 'CREATE' | 'START' | 'COMPLETE' | 'DELETE',
    missionId: string,
    ficheId: string,
    userId: string
  ) => {
    logger.info({ action, missionId, ficheId, userId }, `🔧 Mission: ${action}`)
  },

  controle: (
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    controleId: string,
    missionId: string,
    statut: string,
    userId: string
  ) => {
    logger.info(
      { action, controleId, missionId, statut, userId },
      `📐 Controle: ${action} → ${statut}`
    )
  },

  error: (context: string, error: unknown, extra?: Record<string, unknown>) => {
    logger.error({ err: error, context, ...extra }, `❌ Error in ${context}`)
  }
}