/**
 * @file Header.tsx
 * @description Barre de navigation supérieure.
 *
 * MODIFICATION :
 * ✅ Clic sur le nom/avatar → /profil
 * ✅ Avatar avec initiales (remplace l'icône générique)
 */

import { LogOut, Wifi, WifiOff, HardHat } from 'lucide-react'
import { useAuth }     from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'BRIGADE': return 'Brigade terrain'
      case 'IGT':     return 'Ingénieur Géomètre'
      case 'ADMIN':   return 'Administrateur'
      default:        return ''
    }
  }

  return (
    <header className="bg-[#0D3B66] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* ── LOGO ── */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1B6B93] p-2 rounded-xl">
            <HardHat size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">
              GeoGSC<span className="text-[#00897B]"> Monitoring</span>
            </div>
            <div className="text-xs text-blue-200 hidden sm:block leading-none mt-0.5">
              Grand Stade de Casablanca
            </div>
          </div>
        </div>

        {/* ── DROITE ── */}
        <div className="flex items-center gap-3">

          {/* Indicateur réseau */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isOnline ? 'bg-teal-500/20 text-teal-200' : 'bg-red-500/20 text-red-200'
          }`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>

          {/* ── PROFIL CLIQUABLE ── */}
          {user && (
            <button
              onClick={() => navigate('/profil')}
              className="flex items-center gap-2.5 hover:bg-white/10 rounded-xl px-2 py-1.5 transition-colors group"
              title="Mon profil"
            >
              {/* Avatar initiales */}
              <div className="w-8 h-8 rounded-lg bg-[#1B6B93] group-hover:bg-[#1B6B93]/80 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-colors">
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
              {/* Nom + rôle — masqués sur mobile */}
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold leading-none">
                  {user.prenom} {user.nom}
                </div>
                <div className="text-xs text-blue-200 leading-none mt-0.5">
                  {getRoleLabel()}
                </div>
              </div>
            </button>
          )}

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>

      </div>
    </header>
  )
}