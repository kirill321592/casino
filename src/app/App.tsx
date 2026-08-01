import { useState } from 'react'
import { SessionProvider } from '@/entities/session/model/SessionProvider'
import { useSession } from '@/entities/session/model/useSession'
import { RouletteProvider } from '@/entities/roulette/model/RouletteProvider'
import { AuthPage } from '@/pages/auth/ui/AuthPage'
import { RoulettePage } from '@/pages/roulette/ui/RoulettePage'
import { SlotsPage } from '@/pages/slots/ui/SlotsPage'
import { HomePage, type GameId } from '@/pages/home/ui/HomePage'
import './styles/global.css'

export function App() {
  return (
    <SessionProvider>
      <Root />
    </SessionProvider>
  )
}

function Root() {
  const { user, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center text-muted">
        Loading…
      </div>
    )
  }

  if (!user) return <AuthPage />

  // Keyed by account, so signing in as someone else never inherits the previous
  // player's open game.
  return <Casino key={user.id} />
}

function Casino() {
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
