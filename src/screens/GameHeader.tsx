import { IconButton } from '../components/ui'
import type { GameState } from '../game/types'

interface Props {
  game: GameState
  onExit: () => void
  onUndo: () => void
  onToggleTable: () => void
}

export function GameHeader({ game, onExit, onUndo, onToggleTable }: Props) {
  const shown = Math.min(game.index + 1, game.deck.length)
  return (
    <header className="flex items-center justify-between gap-2">
      <IconButton onClick={onExit} aria-label="Sair para o início" className="-ml-2">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </IconButton>
      <p className="text-sm tabular-nums text-muted" aria-label={`Carta ${shown} de ${game.deck.length}`}>
        {shown} / {game.deck.length}
      </p>
      <div className="-mr-2 flex items-center">
        <IconButton onClick={onUndo} disabled={game.undo.length === 0} aria-label="Voltar o último toque">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar
        </IconButton>
        <IconButton onClick={onToggleTable} aria-pressed={game.tableMode} aria-label="Modo mesa: gira a carta para quem responde">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10 7h4M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Mesa
        </IconButton>
      </div>
    </header>
  )
}
