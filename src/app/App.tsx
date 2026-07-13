import { GameProvider } from './providers/GameProvider'
import { GamePage } from '@/pages/game/ui/GamePage'
import './styles/global.css'

export function App() {
  return (
    <GameProvider>
      <GamePage />
    </GameProvider>
  )
}
