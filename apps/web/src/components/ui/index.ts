/**
 * @file index.ts
 * @description Barrel export — point d'entrée unique pour les composants UI.
 *
 * POURQUOI ?
 * Sans ce fichier, chaque import serait :
 *   import { Button } from '../../components/ui/Button'
 *   import { Badge } from '../../components/ui/Badge'
 *   import { Card } from '../../components/ui/Card'
 *
 * AVEC ce fichier :
 *   import { Button, Badge, Card } from '../../components/ui'
 *
 * Plus propre, plus maintenable.
 */

export { Button } from './Button'
export { Badge } from './Badge'
export { Card } from './Card'
export { Input } from './Input'
export { Modal } from './Modal'
export { Spinner, SpinnerPage } from './Spinner'