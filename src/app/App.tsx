import { useState } from 'react'
import { RouletteProvider } from '@/entities/roulette/model/RouletteProvider'
import { RoulettePage } from '@/pages/roulette/ui/RoulettePage'
import { SlotsPage } from '@/pages/slots/ui/SlotsPage'
import { HomePage, type GameId } from '@/pages/home/ui/HomePage'
import './styles/global.css'

export function App() {
  const [game, setGame] = useState<GameId | null>(null)

  if (game === 'roulette') {
    return (
      <RouletteProvider>
        <RoulettePage onExit={() => setGame(null)} />
      </RouletteProvider>
    )
  }

  if (game === 'slots') {
    return <SlotsPage onExit={() => setGame(null)} />
  }

  return <HomePage onSelect={setGame} />
}
