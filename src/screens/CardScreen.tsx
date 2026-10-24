import { useState } from 'react'
import { Button } from '../components/ui'
import { currentCard, currentPlayer } from '../game/reducer'
import { render } from '../game/render'
import { THEME_LABEL, roundLabel } from '../game/rounds'
import type { GameState } from '../game/types'

interface Props {
  game: GameState
  onAnswered: () => void
  onPass: () => void
}

export function CardScreen({ game, onAnswered, onPass }: Props) {
  const card = currentCard(game)
  if (!card) return null

  const who = currentPlayer(game)
  const me = game.players[who]
  const other = game.players[1 - who]
  // In table mode the phone lies flat between you: player 2 sits across, so the card turns to face them.
  const flipped = game.tableMode && who === 1

  return (
    <div
      className={`flex flex-1 flex-col transition-transform duration-500 ease-in-out ${flipped ? 'rotate-180' : ''}`}
    >
      <p aria-live="polite" className="mt-4 text-center text-lg">
        <span className="text-muted">Vez de </span>
        <span className="font-semibold text-gold">{me.name}</span>
      </p>

      <article
        key={game.index}
        className="my-5 flex flex-1 animate-card-in flex-col rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-black/40"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {roundLabel(card)} · {THEME_LABEL[card.theme]}
        </p>
        <div className="flex flex-1 flex-col justify-center py-6">
          <h2 className="font-serif text-[1.65rem] leading-snug text-balance">{render(card.text, me, other)}</h2>
        </div>
        {/* Keyed by answerer so the follow-up hides again when the turn passes. */}
        <FollowUp key={`${game.index}-${game.answeredBy}`} text={render(card.followUp, me, other)} />
      </article>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onPass}>
          Passar
        </Button>
        <Button className="flex-[2]" onClick={onAnswered}>
          Respondi
        </Button>
      </div>
    </div>
  )
}

function FollowUp({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (open) {
    return (
      <p className="animate-fade-in border-t border-line pt-4 text-lg leading-relaxed text-muted">
        <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-accent">Follow-up</span>
        {text}
      </p>
    )
  }
  return (
    <button type="button" onClick={() => setOpen(true)} className="min-h-11 self-start text-accent underline-offset-4 active:underline">
      Ver follow-up
    </button>
  )
}
