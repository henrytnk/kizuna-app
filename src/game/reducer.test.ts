import { describe, expect, it } from 'vitest'
import { getCard } from './cards'
import { type Action, answeredCount, createGame, currentCard, currentPlayer, reducer } from './reducer'
import { parseSaved } from './storage'
import type { GameState, Mode, Order } from './types'

const players: GameState['players'] = [
  { name: 'Ana', form: 'f' },
  { name: 'Leo', form: 'm' },
]

function start(order: Order = 'by-round', mode: Mode = 'conexao'): GameState {
  return createGame({ players, mode, order, seed: 12345 })
}

function run(s: GameState, ...actions: Action['type'][]): GameState {
  return actions.reduce((acc, type) => reducer(acc, { type, at: 1000 } as Action)!, s)
}

/** Plays forward through intros and both answers (or passes) until the game leaves the card phases. */
function playAll(s: GameState, pass = (_i: number) => false) {
  const dealt: string[] = []
  const phases: string[] = []
  while (s.phase === 'round-intro' || s.phase === 'card') {
    phases.push(s.phase)
    if (s.phase === 'round-intro') s = run(s, 'BEGIN_ROUND')
    else {
      dealt.push(s.deck[s.index])
      s = pass(s.index) ? run(s, 'PASS') : run(s, 'ANSWERED', 'ANSWERED')
    }
  }
  return { s, dealt, phases }
}

describe('reducer', () => {
  it('starts on the round intro with the first card', () => {
    const s = start()
    expect(s.phase).toBe('round-intro')
    expect(s.index).toBe(0)
    expect(run(s, 'BEGIN_ROUND').phase).toBe('card')
  })

  it('records when each round starts, and undo restores the previous start', () => {
    const r1 = reducer(start(), { type: 'BEGIN_ROUND', at: 1000 })!
    expect(r1.roundStartedAt).toBe(1000)
    let s = r1
    while (s.phase === 'card') s = run(s, 'PASS')
    expect(s.phase).toBe('round-intro')
    const r2 = reducer(s, { type: 'BEGIN_ROUND', at: 5000 })!
    expect(r2.roundStartedAt).toBe(5000)
    expect(run(r2, 'UNDO').roundStartedAt).toBe(1000)
  })

  it('needs both answers before dealing the next card', () => {
    const s = run(start(), 'BEGIN_ROUND', 'ANSWERED')
    expect(s.index).toBe(0)
    expect(s.answeredBy).toBe(1)
    expect(run(s, 'ANSWERED').index).toBe(1)
  })

  it('alternates who answers first on each card', () => {
    let s = run(start(), 'BEGIN_ROUND')
    expect(currentPlayer(s)).toBe(0)
    s = run(s, 'ANSWERED')
    expect(currentPlayer(s)).toBe(1)
    s = run(s, 'ANSWERED')
    expect(currentPlayer(s)).toBe(1)
    s = run(s, 'ANSWERED')
    expect(currentPlayer(s)).toBe(0)
  })

  it('shows one intro per round in by-round mode', () => {
    const { phases } = playAll(start('by-round'))
    expect(phases.filter((p) => p === 'round-intro')).toHaveLength(3)
  })

  it('shows a single intro in random mode, and in Nosso futuro', () => {
    for (const s of [start('random'), start('by-round', 'futuro')]) {
      const { phases } = playAll(s)
      expect(phases.filter((p) => p === 'round-intro')).toHaveLength(1)
    }
  })

  it('ends Nosso futuro on the summary, without the eye-contact finale', () => {
    const { s, dealt } = playAll(start('by-round', 'futuro'))
    expect(dealt).toHaveLength(11)
    expect(s.phase).toBe('done')
  })

  it('deals every card once and ends on eye contact, then done', () => {
    const { s, dealt } = playAll(start('by-round'))
    expect(dealt).toEqual(s.deck)
    expect(s.phase).toBe('eye-contact')
    expect(run(s, 'FINISH').phase).toBe('done')
  })

  it('never re-deals a passed card', () => {
    const { s, dealt } = playAll(start(), (i) => i % 3 === 0)
    expect(new Set(dealt).size).toBe(dealt.length)
    expect(dealt).toEqual(s.deck)
    expect(s.passed).toHaveLength(12)
    expect(answeredCount(s)).toBe(24)
  })

  it('never deals a round 2 card before every round 1 card is answered or passed', () => {
    const { dealt } = playAll(start(), (i) => i % 2 === 0)
    const rounds = dealt.map((id) => getCard(id).round as number)
    expect(rounds).toEqual([...rounds].sort((a, b) => a - b))
  })

  it('undo returns to the previous card and turn with the deck unchanged', () => {
    const before = run(start(), 'BEGIN_ROUND', 'ANSWERED', 'ANSWERED', 'ANSWERED')
    const after = run(before, 'PASS')
    expect(after.index).toBe(2)
    const undone = run(after, 'UNDO')
    expect(undone.index).toBe(1)
    expect(undone.answeredBy).toBe(1)
    expect(undone.passed).toEqual([])
    expect(undone.deck).toEqual(before.deck)
    expect(currentCard(undone)?.id).toBe(before.deck[1])
  })

  it('undo keeps the current table mode', () => {
    const s = run(start(), 'BEGIN_ROUND', 'ANSWERED', 'TOGGLE_TABLE')
    expect(run(s, 'UNDO').tableMode).toBe(true)
  })

  it('keeps at most 10 undo steps', () => {
    const { s } = playAll(start())
    expect(s.undo.length).toBe(10)
  })

  it('ignores moves that do not fit the phase', () => {
    const s = start()
    expect(run(s, 'ANSWERED')).toBe(s)
    expect(run(s, 'PASS')).toBe(s)
    expect(run(s, 'FINISH')).toBe(s)
    expect(run(s, 'UNDO')).toBe(s)
  })
})

describe('parseSaved', () => {
  it('round-trips a game in progress', () => {
    const s = run(start(), 'BEGIN_ROUND', 'ANSWERED', 'TOGGLE_TABLE')
    const loaded = parseSaved(JSON.stringify(s))
    expect(loaded).toEqual({ status: 'ok', game: s })
  })

  it('reports nothing saved', () => {
    expect(parseSaved(null)).toEqual({ status: 'none' })
  })

  it('rejects unknown card ids, other versions and garbage', () => {
    const s = start()
    expect(parseSaved(JSON.stringify({ ...s, deck: [...s.deck.slice(1), 'xx-99'] })).status).toBe('invalid')
    // Version 1 saves predate Nosso futuro and the 36-card deck.
    expect(parseSaved(JSON.stringify({ ...s, version: 1 })).status).toBe('invalid')
    expect(parseSaved(JSON.stringify({ ...s, version: 3 })).status).toBe('invalid')
    expect(parseSaved(JSON.stringify({ ...s, deck: [s.deck[0], s.deck[0]] })).status).toBe('invalid')
    expect(parseSaved('{not json').status).toBe('invalid')
  })
})
