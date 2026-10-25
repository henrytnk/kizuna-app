import { type FormEvent, useState } from 'react'
import { Button } from '../components/ui'
import { decodeCode, encodeSeed } from '../game/gameCode'
import type { NewGameOptions } from '../game/reducer'
import type { Form, Order, Player } from '../game/types'

interface Props {
  initial?: Partial<Pick<NewGameOptions, 'players' | 'order' | 'seed'>>
  /** Joining a game started on another phone: asks for its code instead of making a new seed. */
  joining?: boolean
  onStart: (o: Omit<NewGameOptions, 'seed'> & { seed?: number }) => void
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
  className = '',
}: {
  className?: string
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex rounded-xl bg-surface p-1 ${className}`}>
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

export function Setup({ initial, joining = false, onStart, onBack }: Props) {
  const [players, setPlayers] = useState<[Player, Player]>(initial?.players ?? DEFAULT_PLAYERS)
  const [order, setOrder] = useState<Order>(initial?.order ?? 'listed')
  const [code, setCode] = useState(joining && initial?.seed !== undefined ? encodeSeed(initial.seed) : '')
  const [codeError, setCodeError] = useState(false)

  const setPlayer = (i: 0 | 1, patch: Partial<Player>) =>
    setPlayers((ps) => {
      const next: [Player, Player] = [...ps]
      next[i] = { ...next[i], ...patch }
      return next
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const seed = joining ? decodeCode(code) : undefined
    if (seed === null) {
      setCodeError(true)
      return
    }
    const named = players.map((p, i) => ({ ...p, name: p.name.trim() || `Jogador ${i + 1}` })) as [Player, Player]
    onStart({ players: named, order, seed })
  }

  return (
    <form className="screen animate-fade-in" onSubmit={submit}>
      <header className="mb-4 flex items-center">
        <button type="button" onClick={onBack} className="-ml-2 min-h-11 px-2 text-muted">
          ← Voltar
        </button>
      </header>
      <h1 className="font-display font-extrabold text-3xl">{joining ? 'Entrar no jogo' : 'Novo jogo'}</h1>
      {!joining && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          48 perguntas: três rodadas, cada uma mais pessoal, e a rodada final. Cerca de uma hora e quinze.
        </p>
      )}

      <div className="mt-6 flex flex-1 flex-col gap-6">
        {joining && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-muted">Código do outro celular</legend>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setCodeError(false)
              }}
              placeholder="K7Q2"
              aria-label="Código do jogo"
              aria-invalid={codeError}
              aria-describedby="code-help"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="min-h-14 rounded-xl border border-line bg-surface px-4 text-center font-mono text-3xl tracking-[0.3em] text-accent outline-none placeholder:text-muted/40 focus:border-accent aria-invalid:border-accent"
            />
            <p id="code-help" className="text-sm leading-relaxed text-muted">
              {codeError
                ? 'Esse código não parece certo: são 4 letras ou números.'
                : 'Usem os mesmos nomes, na mesma ordem, e a mesma ordem das cartas do outro celular.'}
            </p>
          </fieldset>
        )}
        {([0, 1] as const).map((i) => (
          <fieldset key={i} className="flex gap-2">
            <legend className="mb-2 flex items-center gap-2 text-sm text-muted">
              {/* Each player keeps a color for the whole game: blue like the K card, pink like the ! card. */}
              <span aria-hidden="true" className={`size-2.5 rounded-sm ${i === 0 ? 'bg-sky' : 'bg-accent'}`} />
              {i === 0 ? 'Quem começa' : 'Quem responde em segundo'}
            </legend>
            <input
              value={players[i].name}
              onChange={(e) => setPlayer(i, { name: e.target.value })}
              placeholder={`Nome ${i + 1}`}
              aria-label={`Nome do jogador ${i + 1}`}
              maxLength={24}
              autoComplete="off"
              enterKeyHint={i === 0 ? 'next' : 'done'}
              className="min-h-13 min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 text-lg text-ink outline-none placeholder:text-muted/60 focus:border-accent"
            />
            <Segmented<Form>
              className="w-30 shrink-0"
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
              { value: 'listed', label: 'Na ordem' },
              { value: 'random', label: 'Aleatória' },
            ]}
          />
          <p className="text-sm leading-relaxed text-muted">
            {order === 'listed'
              ? 'Recomendado: as perguntas na ordem do jogo, cada rodada mais pessoal.'
              : 'As rodadas 1 a 3 misturadas; a rodada final continua no fim.'}
          </p>
        </fieldset>
      </div>

      <Button type="submit" className="mt-8">
        Começar
      </Button>
    </form>
  )
}
