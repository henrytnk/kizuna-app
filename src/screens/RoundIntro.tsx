import { Button } from '../components/ui'
import { currentCard, segmentOf } from '../game/reducer'
import { SEGMENTS } from '../game/rounds'
import type { GameState } from '../game/types'

export function RoundIntro({ game, onBegin }: { game: GameState; onBegin: () => void }) {
  const card = currentCard(game)
  if (!card) return null
  const seg = SEGMENTS[segmentOf(card, game.order)]

  return (
    <>
      <div key={game.index} className="flex flex-1 animate-card-in flex-col items-center justify-center text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">{seg.subtitle}</p>
        <h1 className="mt-3 font-serif text-5xl">{seg.title}</h1>
        <p className="mt-6 max-w-xs text-lg leading-relaxed text-muted">{seg.howTo}</p>
      </div>
      <Button onClick={onBegin}>Começar</Button>
    </>
  )
}
