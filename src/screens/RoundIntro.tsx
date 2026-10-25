import { useState } from 'react'
import { Button } from '../components/ui'
import { currentCard, segmentOf } from '../game/reducer'
import { SEGMENTS } from '../game/rounds'
import type { GameState } from '../game/types'
import { ShareGame } from './ShareGame'

export function RoundIntro({ game, onBegin }: { game: GameState; onBegin: () => void }) {
  const [sharing, setSharing] = useState(false)
  const card = currentCard(game)
  if (!card) return null
  const seg = SEGMENTS[segmentOf(card, game.order)]

  return (
    <>
      <div key={game.index} className="flex flex-1 animate-card-in flex-col items-center justify-center text-center">
        {seg.subtitle && <p className="mb-3 text-sm uppercase tracking-[0.2em] text-sky">{seg.subtitle}</p>}
        <h1 className="font-display font-extrabold text-5xl">{seg.title}</h1>
        <p className="mt-6 max-w-xs text-lg leading-relaxed text-muted">{seg.howTo}</p>
        <p className="mt-3 text-sm text-muted">Cerca de {seg.minutes} minutos</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="ghost" onClick={() => setSharing(true)}>
          Jogar em dois celulares
        </Button>
        <Button onClick={onBegin}>Começar</Button>
      </div>
      {sharing && <ShareGame game={game} onClose={() => setSharing(false)} />}
    </>
  )
}
