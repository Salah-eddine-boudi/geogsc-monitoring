/**
 * @file PageLayout.tsx
 * @description Wrapper de page — combine Header + Sidebar + BottomNav + contenu.
 *
 * CHAQUE PAGE utilise ce composant comme wrapper.
 *
 * USAGE dans une page :
 * <PageLayout title="Fiches journalières">
 *   <div>contenu de la page</div>
 * </PageLayout>
 */

import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string        // titre affiché en haut de la page
  action?: React.ReactNode // bouton d'action en haut à droite
}

export function PageLayout({ children, title, action }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header fixe en haut */}
      <Header />

      {/* Corps : Sidebar + contenu principal */}
      <div className="flex flex-1">

        {/* Sidebar — visible uniquement desktop */}
        <Sidebar />

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {/* pb-24 mobile → espace pour la BottomNav fixe */}
            {/* pb-6 desktop → espace normal */}

            {/* En-tête de page avec titre et action */}
            {(title || action) && (
              <div className="flex items-center justify-between mb-6">
                {title && (
                  <h1 className="text-xl font-bold text-[#0D3B66]">
                    {title}
                  </h1>
                )}
                {action && (
                  <div>{action}</div>
                )}
              </div>
            )}

            {/* Contenu de la page */}
            {children}
          </div>
        </main>
      </div>

      {/* BottomNav — visible uniquement mobile */}
      <BottomNav />
    </div>
  )
}