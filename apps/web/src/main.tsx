/**
 * @file main.tsx
 * @description Point d'entrée principal de l'application React.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'


import './index.css'


ReactDOM.createRoot(document.getElementById('root')!).render(
  /**
   * React.StrictMode → mode développement uniquement.
   * Détecte les problèmes potentiels en rendant les composants
   * deux fois pour vérifier les effets de bord.
   * N'affecte PAS la production.
   */
  <React.StrictMode>
    <App />
  </React.StrictMode>
)