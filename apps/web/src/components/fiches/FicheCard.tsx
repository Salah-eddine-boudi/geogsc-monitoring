import { FileText, Calendar, ChevronRight } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import {
  formatDate,
  getStatutFicheLabel,
} from '../../lib/utils'
import type { StatutFiche } from '../../types/api.types'



/**
 * FicheCard — représente une fiche dans la liste.
 *
 * Affiche :
 * → Date de la fiche
 * → Brigade (pour IGT) — avec chaînage optionnel pour éviter les crashes
 * → Nombre de missions
 * → Badge statut coloré
 * → Chevron pour indiquer que c'est cliquable
 */
function FicheCard({
  fiche,
  onClick
}: {
  fiche: {
    id: string
    date: string
    statut: StatutFiche
    brigade?: { nom: string } | null   // optionnel — peut être absent de l'API
    brigadeId?: string
    _count: { missions: number }
    observations: string | null
  }
  onClick: () => void
}) {
  // Map statut → variante Badge
  const badgeVariant: Record<StatutFiche, 'brouillon' | 'soumise' | 'validee' | 'rejetee'> = {
    BROUILLON: 'brouillon',
    SOUMISE: 'soumise',
    VALIDEE: 'validee',
    REJETEE: 'rejetee'
  }

  return (
    <Card onClick={onClick}>
      <div className="p-4 flex items-center gap-4">

        {/* Icône fichier */}
        <div className="flex-shrink-0 w-10 h-10 bg-[#D9EAF5] rounded-xl flex items-center justify-center">
          <FileText size={18} className="text-[#0D3B66]" />
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">

          {/* Ligne 1 : date + badge statut */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Calendar size={14} className="text-gray-400" />
              {formatDate(fiche.date)}
            </div>
            <Badge variant={badgeVariant[fiche.statut]}>
              {getStatutFicheLabel(fiche.statut)}
            </Badge>
          </div>

          {/* Ligne 2 : brigade + nb missions */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* ?.nom → chaînage optionnel : pas de crash si brigade est undefined */}
            {fiche.brigade?.nom && (
              <span className="font-medium text-[#1B6B93]">
                {fiche.brigade.nom}
              </span>
            )}
            {fiche.brigade?.nom && <span>·</span>}
            <span>
              {fiche._count.missions} mission{fiche._count.missions !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Observations (si présentes) — tronquées */}
          {fiche.observations && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {fiche.observations}
            </p>
          )}
        </div>

        {/* Chevron — indique que c'est cliquable */}
        <ChevronRight size={18} className="flex-shrink-0 text-gray-300" />
      </div>
    </Card>
  )
}

export default FicheCard