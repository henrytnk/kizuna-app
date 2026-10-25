import { CARDS, getCard } from './cards'
import { buildDeck } from './deck'
import type { Card, GameState, Order, Player, Snapshot } from './types'

const UNDO_LIMIT = 10

export interface NewGameOptions {
  players: [Player, Player]
  order: Order
  seed: number
  tableMode?: boolean
}

export type Action =
  | ({ type: 'START' } & NewGameOptions)
  | { type: 'BEGIN_ROUND'; at: number }
  | { type: 'ANSWERED' }
  /** A taking-turns card: both have answered, together. */
  | { type: 'ANSWERED_TOGETHER' }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'FINISH' }
  | { type: 'TOGGLE_TABLE' }
  | { type: 'RESET' }

export function createGame(o: NewGameOptions): GameState {
  return {
    version: 3,
    seed: o.seed,
    order: o.order,
    players: o.players,
    deck: buildDeck(CARDS, o),
    index: 0,
    answeredBy: 0,
    passed: [],
    phase: 'round-intro',
    tableMode: o.tableMode ?? false,
    undo: [],
  }
}

/** A "segment" is what gets its own intro screen: each round in by-round mode, the whole mix in random mode, and Nosso futuro either way. */
export function segmentOf(card: Card, order: Order): string {
  if (card.round === 4) return 'futuro'
  return order === 'by-round' ? String(card.round) : 'mix'
}

function startsSegment(s: Pick<GameState, 'deck' | 'order'>, i: number): boolean {
  if (i === 0) return true
  return segmentOf(getCard(s.deck[i]), s.order) !== segmentOf(getCard(s.deck[i - 1]), s.order)
}

function snapshot(s: GameState): Snapshot {
  const { undo: _undo, ...rest } = s
  return rest
}

function withUndo(prev: GameState, next: GameState): GameState {
  return { ...next, undo: [...prev.undo, snapshot(prev)].slice(-UNDO_LIMIT) }
}

function advance(s: GameState): GameState {
  const next = s.index + 1
  const phase = next >= s.deck.length ? 'eye-contact' : startsSegment(s, next) ? 'round-intro' : 'card'
  return { ...s, index: next, answeredBy: 0, phase }
}

export function reducer(s: GameState | null, a: Action): GameState | null {
  if (a.type === 'START') return createGame(a)
  if (a.type === 'RESET' || !s) return null

  switch (a.type) {
    case 'BEGIN_ROUND':
      return s.phase === 'round-intro' ? withUndo(s, { ...s, phase: 'card', roundStartedAt: a.at }) : s
    case 'ANSWERED':
      if (s.phase !== 'card') return s
      return withUndo(s, s.answeredBy === 0 ? { ...s, answeredBy: 1 } : advance(s))
    case 'ANSWERED_TOGETHER':
      return s.phase === 'card' ? withUndo(s, advance(s)) : s
    case 'PASS':
      if (s.phase !== 'card') return s
      return withUndo(s, advance({ ...s, passed: [...s.passed, s.deck[s.index]] }))
    case 'UNDO': {
      const prev = s.undo.at(-1)
      if (!prev) return s
      // Table mode is a seating preference, not a game move: keep it as it is now.
      return { ...prev, tableMode: s.tableMode, undo: s.undo.slice(0, -1) }
    }
    case 'FINISH':
      return s.phase === 'eye-contact' ? { ...s, phase: 'done', undo: [] } : s
    case 'TOGGLE_TABLE':
      return { ...s, tableMode: !s.tableMode }
  }
}

/** Odd cards (1st, 3rd…) start with player A, even cards with player B. */
export function currentPlayer(s: Pick<GameState, 'index' | 'answeredBy'>): 0 | 1 {
  return ((s.index + s.answeredBy) % 2) as 0 | 1
}

export function currentCard(s: GameState): Card | undefined {
  const id = s.deck[s.index]
  return id ? getCard(id) : undefined
}

export function answeredCount(s: GameState): number {
  return Math.min(s.index, s.deck.length) - s.passed.length
}
