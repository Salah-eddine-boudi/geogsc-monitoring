/**
 * @file error-messages.ts
 * @description Traduction des erreurs API en messages lisibles par le technicien terrain.
 * Remplace getErrorMessage() dans useMissionForm.ts
 *
 * RÈGLE : jamais de message technique (code, stack, null, undefined...)
 * Le technicien sur chantier doit comprendre immédiatement quoi faire.
 */

interface ApiErrorResponse {
  code?:    string
  message?: string
  errors?:  { field: string; message: string }[]
}

// ─── Traduction des champs BDD → labels terrain ──────────────────────────────
const LABELS_CHAMPS: Record<string, string> = {
  ouvrageId:               'Ouvrage',
  typeOuvrage:             "Type d'ouvrage",
  categorieAssainissement: 'Catégorie assainissement',
  zone:                    'Zone du stade',
  sousZone:                'Sous-zone',
  axe:                     'Axe',
  fil:                     'Fil',
  niveau:                  'Niveau',
  partieOuvrage:           "Partie d'ouvrage",
  nature:                  "Nature de l'intervention",
  stadeCollage:            'Stade',
  provenanceAppareil:      'Appareil de mesure',
  nomAppareil:             "Nom de l'appareil",
  ecartMm:                 'Écart mesuré',
  travailRealise:          'Travail réalisé',
  resultat:                'Résultat',
  observationsNc:          'Détail de la non-conformité',
  observations:            'Observations',
  ficheReference:          'Référence fiche papier',
  ficheId:                 'Fiche journalière',
}

// ─── Traduction des codes d'erreur métier ─────────────────────────────────────
const MESSAGES_CODE: Record<string, string> = {
  NOT_FOUND:       "Cette fiche ou cet ouvrage n'existe plus. Actualisez la page.",
  FORBIDDEN:       "Vous n'avez pas accès à cette fiche. Contactez votre chef de brigade.",
  STATUT_INVALIDE: "Cette fiche a déjà été soumise. Vous ne pouvez plus la modifier.",
  CONFLICT:        "Une réception identique existe déjà pour ce jour.",
  UNAUTHORIZED:    "Votre session a expiré. Reconnectez-vous.",
}

// ─── Traduction des types d'erreur de validation ──────────────────────────────
function traduireErreurChamp(field: string, rawMessage: string): string {
  const label = LABELS_CHAMPS[field] ?? field

  // Patterns techniques → messages clairs
  if (rawMessage.includes('expected string, received null') ||
      rawMessage.includes('Expected string')) {
    return `${label} : valeur manquante`
  }
  if (rawMessage.includes('min') || rawMessage.includes('too small')) {
    return `${label} : valeur trop courte`
  }
  if (rawMessage.includes('max') || rawMessage.includes('too big')) {
    return `${label} : valeur trop longue (max 500 caractères)`
  }
  if (rawMessage.includes('Invalid enum') || rawMessage.includes('Invalid option')) {
    return `${label} : valeur non reconnue`
  }
  if (rawMessage.includes('required') || rawMessage.includes('min(1)')) {
    return `${label} est obligatoire`
  }

  // Message générique propre
  return `${label} : valeur incorrecte`
}

// ─── Fonction principale exportée ────────────────────────────────────────────
export function getErrorMessage(error: unknown): string {
  const axiosError = error as {
    response?: {
      status?: number
      data?:   ApiErrorResponse
    }
    code?: string
  }

  // Erreur réseau (pas de réponse du serveur)
  if (!axiosError.response || axiosError.code === 'ERR_NETWORK') {
    return "Connexion impossible. Vérifiez votre réseau et réessayez."
  }

  const status = axiosError.response.status
  const data   = axiosError.response.data

  // 401 — session expirée
  if (status === 401) {
    return "Votre session a expiré. Reconnectez-vous."
  }

  // 403 — accès interdit
  if (status === 403) {
    return "Vous n'avez pas les droits pour cette action."
  }

  // 404 — ressource introuvable
  if (status === 404) {
    return "Cette fiche ou cet ouvrage n'existe plus. Actualisez la page."
  }

  // 400 — erreur de validation Zod côté serveur
  if (status === 400 && data?.code === 'VALIDATION_ERROR') {
    if (data.errors?.length) {
      // Premier champ en erreur → message traduit
      const premier = data.errors[0]
      return traduireErreurChamp(premier.field, premier.message)
    }
    return "Certaines informations sont incorrectes. Vérifiez le formulaire."
  }

  // Codes métier connus
  if (data?.code && MESSAGES_CODE[data.code]) {
    return MESSAGES_CODE[data.code]
  }

  // 500 — erreur serveur
  if (status && status >= 500) {
    return "Le serveur a rencontré un problème. Réessayez dans quelques instants."
  }

  // Fallback
  return "Une erreur s'est produite. Réessayez ou contactez le support."
}