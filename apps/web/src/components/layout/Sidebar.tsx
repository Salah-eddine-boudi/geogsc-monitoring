/**
 * @file Sidebar.tsx
 * @description Navigation latérale desktop — visible à partir de md (768px).
 *
 * Sur mobile → remplacée par BottomNav.
 * Sur desktop → affichée à gauche, largeur fixe 240px.
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  HardHat
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  description: string   // sous-titre descriptif
  roles: string[]
}

export function Sidebar() {
  const { user } = useAuth()

  const navItems: NavItem[] = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Vue globale du chantier',
      roles: ['IGT', 'ADMIN']
    },
    {
      to: '/fiches',
      icon: FileText,
      label: 'Fiches journalières',
      description: 'Contrôles topographiques',
      roles: ['BRIGADE', 'IGT', 'ADMIN']
    },
    {
      to: '/rapports',
      icon: BarChart3,
      label: 'Rapports',
      description: 'Synthèse mensuelle',
      roles: ['IGT', 'ADMIN']
    },
    {
      to: '/brigades',
      icon: Users,
      label: 'Brigades',
      description: 'Gestion des équipes',
      roles: ['ADMIN']
    }
  ]

  const visibleItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  )

  return (
    /**
     * hidden md:flex → invisible sur mobile, visible sur desktop
     * w-60 → largeur fixe 240px
     * sticky top-0 → reste visible lors du scroll
     */
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 min-h-screen sticky top-0">

      {/* Infos utilisateur */}
      {user && (
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar initiales */}
            <div className="w-10 h-10 rounded-xl bg-[#D9EAF5] flex items-center justify-center">
              <span className="text-sm font-bold text-[#0D3B66]">
                {user.prenom[0]}{user.nom[0]}
              </span>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-gray-500">
                {user.role === 'BRIGADE' ? 'Brigade terrain' :
                 user.role === 'IGT' ? 'Ingénieur Géomètre' :
                 'Administrateur'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items de navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-150 group
                ${isActive
                  ? 'bg-[#D9EAF5] text-[#0D3B66]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className="flex-shrink-0"
                  />
                  <div>
                    <div className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-gray-500">
                      {item.description}
                    </div>
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer sidebar — version de l'app */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <HardHat size={14} />
          <span>GEOCODING × ANEP</span>
        </div>
        <div className="text-xs text-gray-300 mt-0.5">
          Marché 05/2025/ANEP
        </div>
      </div>
    </aside>
  )
}