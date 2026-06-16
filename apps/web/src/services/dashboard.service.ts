/**
 * @file dashboard.service.ts
 * @description Service Dashboard — appel API stats IGT.
 */

import api from './api'
import type { DashboardStats } from '../types/dashboard.types'

export const dashboardService = {

  async getStats(params: { periode?: string; brigadeId?: string }): Promise<DashboardStats> {
    const { data } = await api.get<{ success: true; stats: DashboardStats }>(
      '/dashboard/stats',
      { params }
    )
    return data.stats
  }
}
