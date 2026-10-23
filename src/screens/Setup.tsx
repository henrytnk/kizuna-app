import { type FormEvent, useState } from 'react'
import { Button } from '../components/ui'
import type { NewGameOptions } from '../game/reducer'
import type { Form, Order, Player } from '../game/types'

interface Props {
  initial?: Pick<NewGameOptions, 'players' | 'order' | 'includeBonus'>
  onStart: (o: Omit<NewGameOptions, 'seed'>) => void
  onBack: () => void
}

const DEFAULT_PLAYERS: [Player, Player] = [
  { name: '', form: 'f' },
  { name: '', form: 'm' },
]

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="min-h-11 flex-1 rounded-lg px-3 text-base text-muted transition aria-checked:bg-surface-2 aria-checked:text-ink aria-checked:shadow"
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Setup({ initial, onStart, onBack }: Props) {
  const [players, setPlayers] = useState<[Player, Player]>(initial?.players ?? DEFAULT_PLAYERS)
  const [order, setOrder] = useState<Order>(initial?.order ?? 'by-round')
  const [includeBonus, setIncludeBonus] = useState(initial?.includeBonus ?? false)

  const setPlayer = (i: 0 | 1, patch: Partial<Player>) =>
    setPlayers((ps) => {
      const next: [Player, Player] = [...ps]
      next[i] = { ...next[i], ...patch }
      return next
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const named = players.map((p, i) => ({ ...p, name: p.name.trim() || `Jogador ${i + 1}` })) as [Player, Player]
    onStart({ players: named, order, includeBonus })
  }

  return (
    <form className="screen animate-fade-in" onSubmit={submit}>
      <header className="mb-6 flex items-center">
        <button type="button" onClick={onBack} className="-ml-2 min-h-11 px-2 text-muted">
          ← Voltar
        </button>
      </header>
      <h1 className="font-serif text-3xl">Novo jogo</h1>

      <div className="mt-6 flex flex-1 flex-col gap-7">
        {([0, 1] as const).map((i) => (
          <fieldset key={i} className="flex flex-col gap-3">
            <legend className="mb-2 text-sm text-muted">{i === 0 ? 'Quem começa' : 'Quem responde em segundo'}</legend>
            <input
              value={players[i].name}
              onChange={(e) => setPlayer(i, { name: e.target.value })}
              placeholder={`Nome ${i + 1}`}
              aria-label={`Nome do jogador ${i + 1}`}
              maxLength={24}
              autoComplete="off"
              enterKeyHint={i === 0 ? 'next' : 'done'}
              className="min-h-13 rounded-xl border border-line bg-surface px-4 text-lg text-ink outline-none placeholder:text-muted/60 focus:border-accent"
            />
            <Segmented<Form>
              label={`Como tratar o jogador ${i + 1}`}
              value={players[i].form}
              onChange={(form) => setPlayer(i, { form })}
              options={[
                { value: 'f', label: 'ela' },
                { value: 'm', label: 'ele' },
              ]}
            />
          </fieldset>
        ))}

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm text-muted">Ordem das cartas</legend>
          <Segmented<Order>
            label="Ordem das cartas"
            value={order}
            onChange={setOrder}
            options={[
              { value: 'by-round', label: 'Por rodada' },
              { value: 'random', label: 'Aleatória' },
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            {order === 'by-round'
              ? 'Recomendado: as perguntas ficam mais profundas a cada rodada.'
              : 'Todas as perguntas misturadas, das leves às mais profundas.'}
          </p>
        </fieldset>

        <label className="flex min-h-11 items-center justify-between gap-4">
          <span>
            <span className="block">Carta bônus sobre família</span>
            <span className="block text-sm text-muted">Entra no fim do jogo</span>
          </span>
          <input
            type="checkbox"
            checked={includeBonus}
            onChange={(e) => setIncludeBonus(e.target.checked)}
            className="size-6 accent-accent"
          />
        </label>
      </div>

      <Button type="submit" className="mt-8">
        Começar
      </Button>
    </form>
  )
}
