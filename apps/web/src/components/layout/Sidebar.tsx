/**
 * @file Sidebar.tsx
 * @description Navigation latérale desktop — conforme à la maquette GeoGSC v1.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BarChart3, Users, HardHat, ClipboardList,
  Car, Wrench, Wallet, MessageSquare, Image, Calendar, FileOutput, Send,
  Map, UserCircle
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { cn } from '../../lib/utils'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  sublabel?: string
  badge?: { text: string; colorClass: string }
  roles: string[]
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const { user } = useAuthStore()

  const navSections: NavSection[] = [
    {
      title: 'Pilotage',
      items: [
        { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',      sublabel: 'Vue globale',         roles: ['IGT', 'ADMIN'] },
        { to: '/plan',       icon: Map,             label: 'Plan du stade',   sublabel: 'Zones & axes',        roles: ['IGT', 'ADMIN'] },
        { to: '/evenements', icon: Calendar,        label: 'Événements CP',   sublabel: 'Réunions & vigilance', roles: ['IGT', 'ADMIN'] },
        { to: '/messagerie', icon: MessageSquare,   label: 'Messagerie',      sublabel: 'Instructions',
          badge: { text: '3', colorClass: 'bg-blue-500' },                                                      roles: ['BRIGADE', 'IGT', 'ADMIN'] },
      ]
    },
    {
      title: 'Terrain',
      items: [
        { to: '/fiches',   icon: FileText,     label: 'Fiches journalières', sublabel: 'Contrôles topo',
          badge: { text: '12', colorClass: 'bg-red-500' },                                                       roles: ['BRIGADE', 'IGT', 'ADMIN'] },
        { to: '/galerie',  icon: Image,        label: 'Galerie photos',       sublabel: 'Vues géoréférencées', roles: ['BRIGADE', 'IGT', 'ADMIN'] },
        { to: '/recap',    icon: ClipboardList, label: 'Récapitulatif',       sublabel: 'Format mensuel Excel', roles: ['IGT', 'ADMIN'] },
      ]
    },
    {
      title: 'Assistante',
      items: [
        { to: '/rh',        icon: Users,    label: 'Ressources RH',   sublabel: 'Moyens humains',    roles: ['ADMIN', 'IGT'] },
        { to: '/materiel',  icon: Wrench,   label: 'Matériel',        sublabel: 'Inventaire chantier', roles: ['ADMIN', 'IGT'] },
        { to: '/vehicules', icon: Car,      label: 'Véhicules',       sublabel: 'Suivi du parc',      roles: ['ADMIN', 'IGT'] },
        { to: '/caisse',    icon: Wallet,   label: 'Caisse projet',   sublabel: 'Gasoil & dépenses',  roles: ['ADMIN', 'IGT'] },
        { to: '/demandes',  icon: Send,     label: 'Demandes',        sublabel: 'RH & logistique',    roles: ['ADMIN', 'IGT'] },
      ]
    },
    {
      title: 'Rapports',
      items: [
        { to: '/generateur', icon: FileOutput, label: 'Générateur',   sublabel: 'Rapport ANEP',      roles: ['IGT', 'ADMIN'] },
        { to: '/rapports',   icon: BarChart3,  label: 'Export',       sublabel: 'Synthèse & fichiers', roles: ['IGT', 'ADMIN'] },
        { to: '/brigades',   icon: Users,      label: 'Brigades',     sublabel: 'Gestion équipes',   roles: ['ADMIN'] },
      ]
    },
    {
      title: 'Brigade',
      items: [
        { to: '/fiches',   icon: FileText,     label: 'Fiches journalières', sublabel: 'Contrôles topo',
          badge: { text: '2', colorClass: 'bg-red-500' },                                                        roles: ['BRIGADE'] },
        { to: '/cp',       icon: ClipboardList, label: 'Comptes Rendus CP',  sublabel: 'Réunions',             roles: ['BRIGADE'] },
        { to: '/demandes', icon: Send,          label: 'Demandes',            sublabel: 'RH & logistique',      roles: ['BRIGADE'] },
        { to: '/galerie',  icon: Image,         label: 'Galerie photos',      sublabel: 'Mes photos',           roles: ['BRIGADE'] },
      ]
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-screen sticky top-0 flex-shrink-0 select-none">

      {/* ── PROFIL UTILISATEUR ── */}
      {user && (
        <NavLink to="/profil" className="p-4 border-b border-gray-100 flex-shrink-0 hover:bg-gray-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B6B93] flex items-center justify-center shadow-sm relative">
              <span className="text-sm font-bold text-white tracking-wide">
                {user.prenom[0]}{user.nom[0]}
              </span>
              {/* Point vert "en ligne" */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-[14px] font-bold text-gray-900 truncate group-hover:text-[#1B6B93] transition-colors">
                {user.prenom} {user.nom}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">
                {user.role === 'BRIGADE' ? 'Chef de brigade' : user.role === 'IGT' ? 'Administrateur' : 'Directeur de projet'}
              </div>
            </div>
            <UserCircle size={16} className="text-gray-300 group-hover:text-[#1B6B93] flex-shrink-0 transition-colors" />
          </div>
        </NavLink>
      )}

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navSections.map((section, idx) => {
          // Filtre les items selon le rôle ET la section selon le rôle
          const visibleItems = section.items.filter(item => user && item.roles.includes(user.role))

          // Masquer les sections Brigade pour IGT/Admin et vice versa
          if (section.title === 'Brigade' && user?.role !== 'BRIGADE') return null
          if (['Pilotage', 'Rapports', 'Assistante'].includes(section.title) && user?.role === 'BRIGADE') return null

          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="mb-6">
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                        isActive
                          ? 'bg-[#D9EAF5] text-[#0D3B66] font-bold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={cn(
                              'flex-shrink-0',
                              isActive ? 'text-[#1B6B93]' : 'text-gray-400 group-hover:text-gray-600'
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] leading-tight truncate">{item.label}</div>
                            {item.sublabel && (
                              <div className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">{item.sublabel}</div>
                            )}
                          </div>
                          {item.badge && (
                            <span className={cn(
                              'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white',
                              item.badge.colorClass
                            )}>
                              {item.badge.text}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── FOOTER ── */}
      <div className="p-4 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5 text-[13px] font-extrabold text-gray-700 tracking-tight">
          <HardHat size={16} className="text-[#1B6B93]" />
          <span>GEOCODING × ANEP</span>
        </div>
        <div className="text-[11px] font-medium text-gray-400 mt-1 pl-6">
          Marché 05/2025/ANEP
        </div>
      </div>

    </aside>
  )
}