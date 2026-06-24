import api from './api'

export const exportService = {
  async telechargerRapport(brigadeId: string, nomBrigade: string): Promise<void> {
    const response = await api.get(`/export/excel/${brigadeId}`, { responseType: 'blob' })
    const nomSanitize = nomBrigade.replace(/[^a-zA-Z0-9]/g, '_')
    const url  = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href  = url
    link.setAttribute('download', `Rapport_Topo_GSC_${nomSanitize}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}