import { useAuthUser } from '@/entities/session/model/useSession'
import { BalanceCard } from '@/entities/session/ui/BalanceCard'
import { SignOutButton } from '@/features/sign-out/ui/SignOutButton'
import { Link } from 'react-router'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'

export type GameId = 'roulette' | 'slots'

interface GameCard {
  id: GameId
  title: string
  description: string
  icon: string
  accent: string
  available: boolean
}

const games: GameCard[] = [
  {
    id: 'roulette',
    title: 'European Roulette',
    description: 'Place your bets and spin the wheel. Single zero, classic odds.',
    icon: '🎡',
    accent: 'from-table-red/30 to-table-green/30',
    available: true,
  },
  {
    id: 'slots',
    title: 'Lucky Slots',
    description: 'Spin the reels and chase the jackpot.',
    icon: '🎰',
    accent: 'from-gold/25 to-gold-deep/25',
    available: true,
  },
]

interface HomePageProps {
  /** Called on hover/focus so the game's chunk is already in flight on click. */
  onPreload?: (game: GameId) => void
}

export function HomePage({ onPreload }: HomePageProps) {
  const user = useAuthUser()

  return (
    <div className="page-shell">
      <title>Lobby · European Casino</title>
      <div className="mb-6 flex items-center justify-end gap-4">
        <BalanceCard balance={user.balance} />
        <SignOutButton />
      </div>

      <header className="mb-8 text-center">
        <h1 className="m-0 text-3xl sm:text-[2.5rem]">Casino Lobby</h1>
        <p className="mt-2 text-muted">Choose a game to start playing.</p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 sm:gap-6">
        {games.map((game) =>
          game.available ? (
            /* A link, not a button: the game has its own address, so it opens in a
             * new tab and survives a reload like any other page. */
            <Link
              key={game.id}
              to={routes[game.id]}
              onMouseEnter={() => onPreload?.(game.id)}
              onFocus={() => onPreload?.(game.id)}
              /* Touch never hovers, and pointerdown still beats the click by a frame. */
              onPointerDown={() => onPreload?.(game.id)}
              className={cn(cardClass, 'hover:-translate-y-1 hover:border-gold/50')}
            >
              <GameCardContent game={game} />
            </Link>
          ) : (
            <div
              key={game.id}
              aria-disabled
              className={cn(cardClass, 'cursor-not-allowed opacity-60')}
            >
              <GameCardContent game={game} />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

const cardClass =
  'card group relative flex flex-col items-start gap-3 overflow-hidden p-6 text-left text-inherit no-underline transition-[transform,opacity] duration-150'

function GameCardContent({ game }: { game: GameCard }) {
  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
          game.accent,
        )}
      />
      <div className="relative flex w-full items-center justify-between">
        <span className="text-5xl" aria-hidden>
          {game.icon}
        </span>
        {!game.available && (
          <span className="rounded-full border border-slate-400/30 bg-surface/80 px-3 py-1 text-xs uppercase tracking-[0.08em] text-muted">
            Soon
          </span>
        )}
      </div>
      <h2 className="relative m-0 text-xl">{game.title}</h2>
      <p className="relative m-0 text-sm text-muted">{game.description}</p>
      {game.available && (
        <span className="relative mt-2 font-bold text-gold group-hover:text-gold-soft">
          Play now →
        </span>
      )}
    </>
  )
}
