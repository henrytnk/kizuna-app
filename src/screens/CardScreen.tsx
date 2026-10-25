import { type ReactNode, useState } from 'react'
import { Button } from '../components/ui'
import { currentPlayer } from '../game/reducer'
import { render } from '../game/render'
import { THEME_LABEL, roundLabel } from '../game/rounds'
import type { Card, GameState } from '../game/types'

/** A taking-turns card: five qualities each, alternating, so ten turns in all. */
const TOGETHER_TURNS = 10
const TURN_PULSE_MS = 30

interface Props {
  game: GameState
  card: Card
  onAnswered: () => void
  onAnsweredTogether: () => void
  onPass: () => void
}

export function CardScreen({ game, card, onAnswered, onAnsweredTogether, onPass }: Props) {
  return card.together ? (
    // Keyed by card so the turn count starts over on each taking-turns card.
    <TogetherCard key={game.index} game={game} card={card} onDone={onAnsweredTogether} onPass={onPass} />
  ) : (
    <SingleCard game={game} card={card} onAnswered={onAnswered} onPass={onPass} />
  )
}

function SingleCard({ game, card, onAnswered, onPass }: Omit<Props, 'onAnsweredTogether'>) {
  const who = currentPlayer(game)
  const me = game.players[who]
  const other = game.players[1 - who]
  return (
    <CardLayout
      game={game}
      card={card}
      who={who}
      text={render(card.text, me, other)}
      // Keyed by answerer so the follow-up hides again when the turn passes.
      followUp={<FollowUp key={`${game.index}-${game.answeredBy}`} text={render(card.followUp, me, other)} />}
      onPass={onPass}
      onAnswered={onAnswered}
    />
  )
}

/**
 * Both answer within the card, back and forth, as in the original "alternate sharing" item.
 * Each Respondi passes the turn; the last one deals the next card.
 */
function TogetherCard({ game, card, onDone, onPass }: { game: GameState; card: Card; onDone: () => void; onPass: () => void }) {
  const [turn, setTurn] = useState(0)
  const first = currentPlayer(game)
  const who = ((first + turn) % 2) as 0 | 1
  const me = game.players[who]
  const other = game.players[1 - who]

  const answered = () => {
    if (turn === TOGETHER_TURNS - 1) return onDone()
    setTurn(turn + 1)
    navigator.vibrate?.(TURN_PULSE_MS)
  }

  return (
    <CardLayout
      game={game}
      card={card}
      who={who}
      label="Os dois, revezando"
      text={render(card.text, me, other)}
      extra={
        <div
          role="progressbar"
          aria-label="Qualidades ditas"
          aria-valuemin={0}
          aria-valuemax={TOGETHER_TURNS}
          aria-valuenow={turn}
          aria-valuetext={`${turn} de ${TOGETHER_TURNS}`}
          className="mb-5 flex justify-center gap-2"
        >
          {Array.from({ length: TOGETHER_TURNS }, (_, i) => {
            const color = (first + i) % 2 === 0 ? 'bg-sky' : 'bg-accent'
            const state = i < turn ? 'opacity-100' : i === turn ? 'opacity-100 scale-125' : 'opacity-25'
            return <span key={i} className={`size-2.5 rounded-full transition ${color} ${state}`} />
          })}
        </div>
      }
      followUp={<FollowUp text={render(card.followUp, me, other)} />}
      onPass={onPass}
      onAnswered={answered}
    />
  )
}

function CardLayout({
  game,
  card,
  who,
  label,
  text,
  extra,
  followUp,
  onPass,
  onAnswered,
}: {
  game: GameState
  card: Card
  who: 0 | 1
  label?: string
  text: string
  extra?: ReactNode
  followUp: ReactNode
  onPass: () => void
  onAnswered: () => void
}) {
  // In table mode the phone lies flat between you: player 2 sits across, so the card turns to face them.
  const flipped = game.tableMode && who === 1

  return (
    <div
      className={`flex flex-1 flex-col transition-transform duration-500 ease-in-out ${flipped ? 'rotate-180' : ''}`}
    >
      <p aria-live="polite" className="mt-4 text-center text-lg">
        <span className="text-muted">Vez de </span>
        <span className={`font-display font-extrabold ${who === 0 ? 'text-sky' : 'text-accent'}`}>
          {game.players[who].name}
        </span>
      </p>

      <article
        key={game.index}
        className={`my-5 flex flex-1 animate-card-in flex-col rounded-3xl border border-t-4 border-line bg-surface p-6 shadow-2xl shadow-black/40 transition-colors ${who === 0 ? 'border-t-sky' : 'border-t-accent'}`}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {label ? `${roundLabel(card)} · ${label}` : `${roundLabel(card)} · ${THEME_LABEL[card.theme]}`}
        </p>
        <div className="flex flex-1 flex-col justify-center py-6">
          <h2 className="font-display text-[1.65rem] leading-snug font-bold text-balance">{text}</h2>
        </div>
        {extra}
        {followUp}
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
