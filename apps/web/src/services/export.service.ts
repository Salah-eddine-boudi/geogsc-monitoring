/**
 * @file export.service.ts
 * @description Service export — télécharge le fichier Excel récap mensuel.
 *
 * PARTICULARITÉ :
 * On n'utilise pas axios ici car on reçoit un fichier binaire (Buffer).
 * On utilise l'API fetch native avec responseType blob.
 *
 * BLOB = Binary Large OBject
 * → Représente des données binaires en mémoire
 * → Ici : le fichier Excel .xlsx
 *
 * FLUX :
 * 1. Fetch GET /export/excel/:brigadeId/:periode
 * 2. Réponse = fichier binaire (.xlsx)
 * 3. Crée un lien temporaire <a> dans le DOM
 * 4. Simule un clic → téléchargement déclenché
 * 5. Supprime le lien temporaire
 */

import api from './api'

export const exportService = {

  async exporterExcel(brigadeId: string, periode: string): Promise<void> {

    /**
     * On utilise axios avec responseType: 'blob'
     * pour recevoir les données binaires correctement.
     * Sans ça, axios essaie de parser le binaire en JSON → erreur.
     */
    const response = await api.get(
      `/export/excel/${brigadeId}/${periode}`,
      { responseType: 'blob' }
    )

    /**
     * Crée une URL temporaire pointant vers le blob en mémoire.
     * URL.createObjectURL → génère une URL de type "blob:http://..."
     */
    const url = window.URL.createObjectURL(new Blob([response.data]))

    /**
     * Crée un lien <a> invisible dans le DOM.
     * On lui donne l'URL du blob et le nom du fichier.
     * Puis on simule un clic → le navigateur déclenche le téléchargement.
     */
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Rapport_Topo_GSC_${periode}.xlsx`)
    document.body.appendChild(link)
    link.click()

    /**
     * Nettoyage :
     * - Supprime le lien du DOM
     * - Libère la mémoire du blob
     * Sans ça → memory leak (fuite mémoire)
     */
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}