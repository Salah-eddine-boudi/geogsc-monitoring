/**
 * @file ProfilPage.tsx — Mon profil
 * Informations personnelles, changement de mot de passe, préférences
 */
import { useState } from 'react'
import { User, Lock, Moon, Sun } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card }       from '../../components/ui/Card'
import { Button }     from '../../components/ui/Button'
import { useAuth }    from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<string, string> = {
  BRIGADE: 'Chef de brigade — Topographe',
  IGT:     'IGT — Chef de projet',
  ADMIN:   'Administrateur — Directeur de projet',
}

export function ProfilPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: user?.email ?? '', gsm: '' })
  const [pwd, setPwd]   = useState({ actuel: '', nouveau: '', confirm: '' })
  const [darkMode, setDarkMode] = useState(false)
  const [notifs, setNotifs] = useState({ nc: true, rappel18h: true, vehicules: true })

  const handleSaveProfile = async () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); toast.success('Profil mis à jour') }, 800)
  }

  const handleChangePwd = async () => {
    if (pwd.nouveau !== pwd.confirm) { toast.error('Les mots de passe ne correspondent pas'); return }
    if (pwd.nouveau.length < 8) { toast.error('Minimum 8 caractères'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); toast.success('Mot de passe modifié'); setPwd({ actuel: '', nouveau: '', confirm: '' }) }, 800)
  }

  const inputClass = "w-full h-11 px-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93] bg-white"

  return (
    <PageLayout title="Mon profil">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* ── CARTE IDENTITÉ ── */}
        <div className="p-5 bg-[#0D3B66] rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white">{user?.prenom} {user?.nom}</p>
            <p className="text-sm text-white/70">{user?.email}</p>
          </div>
          <span className="text-xs bg-white/20 text-white px-3 py-1.5 rounded-full font-semibold">
            {user?.role}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── INFORMATIONS PERSONNELLES ── */}
          <Card>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <User size={16} className="text-[#1B6B93]" />
              <span className="text-sm font-semibold text-[#0D3B66]">Informations personnelles</span>
            </div>
            <Card.Body className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Nom complet</label>
                <input type="text" disabled value={`${user?.prenom} ${user?.nom}`}
                  className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                <p className="text-xs text-gray-400 mt-1">Non modifiable</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Fonction</label>
                <input type="text" disabled value={ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? ''}
                  className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Adresse email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Téléphone</label>
                <input type="tel" placeholder="+212 6 61 XX XX XX" value={form.gsm}
                  onChange={e => setForm(f => ({ ...f, gsm: e.target.value }))}
                  className={inputClass} />
              </div>
              <Button variant="primary" size="sm" loading={loading} onClick={handleSaveProfile} className="w-full">
                Enregistrer
              </Button>
            </Card.Body>
          </Card>

          {/* ── MOT DE PASSE ── */}
          <Card>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Lock size={16} className="text-[#1B6B93]" />
              <span className="text-sm font-semibold text-[#0D3B66]">Mot de passe</span>
            </div>
            <Card.Body className="space-y-3">
              <p className="text-xs text-gray-400">Choisissez un mot de passe robuste — 8 caractères minimum.</p>
              {[
                { label: 'Mot de passe actuel', key: 'actuel' },
                { label: 'Nouveau mot de passe', key: 'nouveau' },
                { label: 'Confirmer le nouveau', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                  <input type="password" placeholder="••••••••"
                    value={(pwd as any)[key]}
                    onChange={e => setPwd(p => ({ ...p, [key]: e.target.value }))}
                    className={inputClass} />
                </div>
              ))}
              <Button variant="primary" size="sm" loading={loading} onClick={handleChangePwd} className="w-full bg-[#00897B] hover:bg-[#00796B]">
                Modifier le mot de passe
              </Button>
            </Card.Body>
          </Card>

        </div>

        {/* ── PRÉFÉRENCES ── */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-[#0D3B66]">Préférences</p>
          </div>
          <Card.Body className="space-y-4">
            {/* Thème */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Thème de l'interface</p>
              <p className="text-xs text-gray-400 mb-3">Clair pour le bureau, sombre pour le terrain de nuit.</p>
              <div className="flex gap-2">
                {[
                  { label: 'Clair', icon: Sun,  val: false },
                  { label: 'Sombre', icon: Moon, val: true },
                ].map(({ label, icon: Icon, val }) => (
                  <button key={label} onClick={() => setDarkMode(val)}
                    className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all ${
                      darkMode === val ? 'bg-[#0D3B66] text-white border-[#0D3B66]' : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    <Icon size={15} />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notifications</p>
              <div className="space-y-3">
                {[
                  { key: 'nc', label: 'Non-conformités', desc: 'Alerte dès qu\'une NC est saisie sur le terrain' },
                  { key: 'rappel18h', label: 'Rappel fiches 18h', desc: 'Si une équipe n\'a pas rempli sa fiche du jour' },
                  { key: 'vehicules', label: 'Alertes véhicules', desc: 'Documents expirant dans moins de 30 jours' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                    <button onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${(notifs as any)[key] ? 'bg-[#00897B]' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${(notifs as any)[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

      </div>
    </PageLayout>
  )
}