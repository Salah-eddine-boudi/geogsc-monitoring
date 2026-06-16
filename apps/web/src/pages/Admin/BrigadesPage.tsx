/**
 * @file BrigadesPage.tsx
 * @description Page gestion des brigades — ADMIN uniquement.
 *
 * FONCTIONNALITÉS :
 * → Liste des brigades avec statut actif/inactif
 * → Créer une nouvelle brigade
 * → Activer/désactiver une brigade
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLayout } from '../../components/layout/PageLayout'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { SpinnerPage } from '../../components/ui/Spinner'
import api from '../../services/api'
import type { Brigade } from '../../types/api.types'

// ─── MODAL NOUVELLE BRIGADE ───────────────────────────────────────

function NouvelleBrigadeModal({
  isOpen, onClose, onSuccess
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [nom, setNom] = useState('')
  const [chef, setChef] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || !chef.trim()) {
      toast.error('Nom et chef obligatoires')
      return
    }
    setLoading(true)
    try {
      await api.post('/brigades', { nom: nom.trim(), chef: chef.trim() })
      toast.success('Brigade créée')
      onSuccess()
      onClose()
      setNom('')
      setChef('')
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { code?: string } } }
      if (axiosError.response?.data?.code === 'CONFLICT') {
        toast.error('Une brigade avec ce nom existe déjà')
      } else {
        toast.error('Erreur lors de la création')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle brigade">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la brigade"
          placeholder="Ex: Équipe 05"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
        <Input
          label="Chef de brigade"
          placeholder="Ex: M. ALAMI"
          value={chef}
          onChange={(e) => setChef(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
            Créer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function BrigadesPage() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['brigades'],
    queryFn: async () => {
      const response = await api.get<{ brigades: Brigade[] }>('/brigades?includeInactive=true')
      return response.data.brigades
    }
  })

  const handleToggleActif = async (brigade: Brigade) => {
    setTogglingId(brigade.id)
    try {
      await api.patch(`/brigades/${brigade.id}`, { actif: !brigade.actif })
      toast.success(brigade.actif ? 'Brigade désactivée' : 'Brigade activée')
      queryClient.invalidateQueries({ queryKey: ['brigades'] })
    } catch {
      toast.error('Erreur')
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) return <SpinnerPage />

  const brigades = data ?? []
  const actives = brigades.filter(b => b.actif).length

  return (
    <PageLayout
      title="Gestion des brigades"
      action={
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span className="hidden sm:inline">Nouvelle brigade</span>
        </Button>
      }
    >
      <div className="space-y-4">

        {/* Résumé */}
        <div className="flex items-center gap-3 p-3 bg-[#D9EAF5] rounded-xl">
          <Users size={18} className="text-[#0D3B66]" />
          <span className="text-sm text-[#0D3B66] font-medium">
            {actives} brigade{actives !== 1 ? 's' : ''} active{actives !== 1 ? 's' : ''}
            {' '}sur {brigades.length}
          </span>
        </div>

        {/* Liste brigades */}
        {brigades.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Aucune brigade</p>
            <Button variant="primary" size="md" onClick={() => setShowModal(true)} className="mx-auto w-auto">
              <Plus size={18} />
              Créer la première brigade
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {brigades.map((brigade) => (
              <Card key={brigade.id}>
                <Card.Body>
                  <div className="flex items-center gap-4">

                    {/* Avatar initiales */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${brigade.actif ? 'bg-[#D9EAF5]' : 'bg-gray-100'}
                    `}>
                      <span className={`text-sm font-bold ${brigade.actif ? 'text-[#0D3B66]' : 'text-gray-400'}`}>
                        {brigade.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Infos brigade */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${brigade.actif ? 'text-gray-900' : 'text-gray-400'}`}>
                          {brigade.nom}
                        </span>
                        {brigade.actif ? (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Chef : {brigade.chef}
                      </div>
                    </div>

                    {/* Bouton toggle actif */}
                    <button
                      onClick={() => handleToggleActif(brigade)}
                      disabled={togglingId === brigade.id}
                      className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title={brigade.actif ? 'Désactiver' : 'Activer'}
                    >
                      {brigade.actif
                        ? <XCircle size={20} className="text-red-400 hover:text-red-600" />
                        : <CheckCircle size={20} className="text-gray-300 hover:text-teal-600" />
                      }
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NouvelleBrigadeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetch}
      />
    </PageLayout>
  )
}