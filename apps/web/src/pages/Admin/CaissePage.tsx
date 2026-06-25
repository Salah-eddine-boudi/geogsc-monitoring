/**
 * @file CaissePage.tsx
 * @description M13 — Caisse projet.
 * Journal de dépenses, dotations gasoil, solde en temps réel.
 *
 * ROUTES : /caisse
 * ACCÈS  : ADMIN, IGT
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingDown, Wallet, Plus, Download, Info } from 'lucide-react'
import { PageLayout }  from '../../components/layout/PageLayout'
import { Card }        from '../../components/ui/Card'
import { Button }      from '../../components/ui/Button'
import { Modal }       from '../../components/ui/Modal'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── TYPES ────────────────────────────────────────────────────────

interface Depense {
  id:          string
  date:        string
  motif:       string
  montant:     number
  categorie:   'GASOIL' | 'LOGEMENT' | 'TRANSPORT' | 'MAINTENANCE' | 'CONSOMMABLE' | 'DOTATION' | 'DIVERS'
  beneficiaire?: string
}

// ─── HELPERS ──────────────────────────────────────────────────────

function categorieColor(cat: string) {
  const map: Record<string, string> = {
    GASOIL:       'bg-amber-100 text-amber-700',
    LOGEMENT:     'bg-blue-100 text-blue-700',
    TRANSPORT:    'bg-purple-100 text-purple-700',
    MAINTENANCE:  'bg-orange-100 text-orange-700',
    CONSOMMABLE:  'bg-cyan-100 text-cyan-700',
    DOTATION:     'bg-teal-100 text-teal-700',
    DIVERS:       'bg-gray-100 text-gray-600',
  }
  return map[cat] ?? 'bg-gray-100 text-gray-600'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

function formatMontant(m: number, isCredit = false) {
  const prefix = isCredit ? '+' : '−'
  return `${prefix} ${Math.abs(m).toLocaleString('fr-MA')} DH`
}

// ─── MODAL DÉPENSE ────────────────────────────────────────────────

function NouvelleDépenseModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({ motif: '', montant: '', categorie: 'GASOIL', beneficiaire: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/caisse', { ...form, montant: -Math.abs(Number(form.montant)) })
      toast.success('Dépense enregistrée')
      onSuccess(); onClose()
    } catch { toast.error('Erreur lors de l\'enregistrement') }
    finally { setLoading(false) }
  }

  const inputClass = "w-full h-11 px-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93]"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle dépense">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Motif</label>
          <input type="text" placeholder="Description de la dépense" required className={inputClass}
            value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Montant (DH)</label>
          <input type="number" placeholder="0" required min="1" className={inputClass}
            value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Catégorie</label>
          <select className={inputClass} value={form.categorie}
            onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
            {['GASOIL', 'LOGEMENT', 'TRANSPORT', 'MAINTENANCE', 'CONSOMMABLE', 'DIVERS'].map(c => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Bénéficiaire</label>
          <input type="text" placeholder="Fournisseur ou personne" className={inputClass}
            value={form.beneficiaire} onChange={e => setForm(f => ({ ...f, beneficiaire: e.target.value }))} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function CaissePage() {
  const [showModal, setShowModal] = useState(false)

  // Données mockées en attendant l'API /caisse
  const depenses: Depense[] = [
    { id: '1', date: '2026-06-20', motif: 'Gasoil — dotation équipes',   montant: -1500, categorie: 'GASOIL',      beneficiaire: 'Station Afriquia' },
    { id: '2', date: '2026-06-18', motif: 'Pige topographique (lot 6)',   montant: -640,  categorie: 'CONSOMMABLE', beneficiaire: 'Quincaillerie Atlas' },
    { id: '3', date: '2026-06-15', motif: 'Réparation trépied',           montant: -380,  categorie: 'MAINTENANCE', beneficiaire: 'SAV Leica Casa' },
    { id: '4', date: '2026-06-10', motif: 'Dotation caisse projet',       montant: 6000,  categorie: 'DOTATION',    beneficiaire: 'Siège GEOCODING' },
    { id: '5', date: '2026-06-05', motif: 'Gasoil — dotation équipes',    montant: -1500, categorie: 'GASOIL',      beneficiaire: 'Station Afriquia' },
  ]

  const dotation  = depenses.filter(d => d.montant > 0).reduce((s, d) => s + d.montant, 0)
  const depenses_ = depenses.filter(d => d.montant < 0).reduce((s, d) => s + Math.abs(d.montant), 0)
  const solde     = dotation - depenses_
  const prochaine = '25/06/2026'

  return (
    <PageLayout
      title="Caisse projet"
      action={
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Nouvelle dépense
        </Button>
      }
    >
      <div className="space-y-4">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-[#0D3B66]">
                    {dotation.toLocaleString('fr-MA')} DH
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Dotation du mois</div>
                  <div className="text-xs text-gray-400">créditée</div>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50">
                  <DollarSign size={20} className="text-teal-600" />
                </div>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {depenses_.toLocaleString('fr-MA')} DH
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Dépenses du mois</div>
                  <div className="text-xs text-gray-400">{depenses.filter(d => d.montant < 0).length} opérations</div>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50">
                  <TrendingDown size={20} className="text-red-600" />
                </div>
              </div>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${solde >= 0 ? 'text-[#00897B]' : 'text-red-600'}`}>
                    {solde.toLocaleString('fr-MA')} DH
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Solde en temps réel</div>
                  <div className="text-xs text-gray-400">au {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
                </div>
                <div className={`p-2.5 rounded-xl ${solde >= 0 ? 'bg-teal-50' : 'bg-red-50'}`}>
                  <Wallet size={20} className={solde >= 0 ? 'text-teal-600' : 'text-red-600'} />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* ── INFO PROCHAINE DOTATION ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Prochaine dotation gasoil : <strong>{prochaine}</strong> — montant fixe{' '}
            <strong>1 500 DH</strong> par équipe.
          </p>
        </div>

        {/* ── JOURNAL ── */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#0D3B66]">
              Journal des dépenses — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>
            <button className="flex items-center gap-1.5 text-xs text-[#1B6B93] hover:text-[#0D3B66] font-medium">
              <Download size={14} />
              Export journal
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Motif</th>
                  <th className="px-4 py-3 text-left font-semibold">Bénéficiaire</th>
                  <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {depenses.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.date)}</td>
                    <td className="px-4 py-3 text-gray-800">{d.motif}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{d.beneficiaire ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categorieColor(d.categorie)}`}>
                        {d.categorie.charAt(0) + d.categorie.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap ${
                      d.montant > 0 ? 'text-teal-600' : 'text-red-600'
                    }`}>
                      {formatMontant(d.montant, d.montant > 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <NouvelleDépenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {}}
      />
    </PageLayout>
  )
}