import { Button, Logo } from '../components/ui'
import { answeredCount } from '../game/reducer'
import type { GameState } from '../game/types'

export function End({ game, onPlayAgain, onHome }: { game: GameState; onPlayAgain: () => void; onHome: () => void }) {
  const answered = answeredCount(game)
  return (
    <div className="screen animate-fade-in">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo className="mb-6 w-24" />
        <h1 className="font-serif text-4xl text-balance">
          Vocês responderam {answered} de {game.deck.length} cartas
        </h1>
        <p className="mt-6 max-w-xs text-lg leading-relaxed text-muted">
          Nenhuma resposta foi salva. O que vocês disseram fica só entre vocês.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button onClick={onPlayAgain}>Jogar de novo</Button>
        <Button variant="secondary" onClick={onHome}>
          Início
        </Button>
      </div>
    </div>
  )
}
