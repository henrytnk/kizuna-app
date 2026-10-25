import { useState } from 'react'
import { Button } from '../components/ui'
import { encodeSeed, inviteHash } from '../game/gameCode'
import type { GameState } from '../game/types'

export function ShareGame({ game, onClose }: { game: GameState; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const code = encodeSeed(game.seed)
  const link = `${location.origin}/${inviteHash(game)}`
  const canShare = typeof navigator.share === 'function'

  const share = async () => {
    try {
      if (canShare) await navigator.share({ title: 'Kizuna Quiz', text: `Código do jogo: ${code}`, url: link })
      else {
        await navigator.clipboard.writeText(link)
        setCopied(true)
      }
    } catch {
      // Share sheet dismissed, or clipboard blocked: the code on screen still works.
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex animate-fade-in items-end bg-black/70" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-[34rem] rounded-t-3xl border-t border-line bg-surface p-6 pb-[max(env(safe-area-inset-bottom),24px)]"
      >
        <h2 id="share-title" className="font-display font-extrabold text-2xl">
          Jogar em dois celulares
        </h2>
        <p className="mt-2 text-muted">
          No outro celular, abram o link ou toquem em “Entrar com código” e digitem:
        </p>
        <p className="my-5 text-center font-mono text-5xl tracking-[0.3em] text-accent" aria-label={`Código ${code.split('').join(' ')}`}>
          {code}
        </p>
        <p className="text-sm leading-relaxed text-muted">
          {game.order === 'random' ? 'Ordem aleatória' : 'Ordem por rodada'}. Usem a mesma ordem de nomes:{' '}
          <span className="text-ink">{game.players[0].name}</span> começa. Cada celular avança por conta própria.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={share}>{canShare ? 'Compartilhar link' : copied ? 'Link copiado' : 'Copiar link'}</Button>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
