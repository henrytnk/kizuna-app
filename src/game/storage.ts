import { CARD_BY_ID } from './cards'
import type { GameState, Phase } from './types'

const KEY = 'kizuna:game'
const PHASES: Phase[] = ['round-intro', 'card', 'eye-contact', 'done']

export type Loaded = { status: 'none' } | { status: 'invalid' } | { status: 'ok'; game: GameState }

function isPlayer(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false
  const { name, form } = p as Record<string, unknown>
  return typeof name === 'string' && (form === 'm' || form === 'f')
}

function isValidGame(g: unknown): g is GameState {
  if (!g || typeof g !== 'object') return false
  const s = g as Record<string, unknown>
  const deck = s.deck
  return (
    s.version === 3 &&
    Number.isInteger(s.seed) &&
    (s.order === 'by-round' || s.order === 'random') &&
    Array.isArray(s.players) &&
    s.players.length === 2 &&
    s.players.every(isPlayer) &&
    Array.isArray(deck) &&
    deck.length > 0 &&
    deck.every((id) => typeof id === 'string' && CARD_BY_ID.has(id)) &&
    new Set(deck).size === deck.length &&
    Number.isInteger(s.index) &&
    (s.index as number) >= 0 &&
    (s.index as number) <= deck.length &&
    (s.answeredBy === 0 || s.answeredBy === 1) &&
    Array.isArray(s.passed) &&
    s.passed.every((id) => deck.includes(id)) &&
    PHASES.includes(s.phase as Phase) &&
    typeof s.tableMode === 'boolean' &&
    (s.roundStartedAt === undefined || Number.isFinite(s.roundStartedAt))
  )
}

export function parseSaved(raw: string | null): Loaded {
  if (raw === null) return { status: 'none' }
  try {
    const data: unknown = JSON.parse(raw)
    if (!isValidGame(data)) return { status: 'invalid' }
    // Snapshots come from the same deck; drop any that don't check out rather than fail the whole game.
    const undo = Array.isArray(data.undo) ? data.undo.filter(isValidGame) : []
    return { status: 'ok', game: { ...data, undo } }
  } catch {
    return { status: 'invalid' }
  }
}

export function loadGame(): Loaded {
  try {
    return parseSaved(localStorage.getItem(KEY))
  } catch {
    return { status: 'none' }
  }
}

export function saveGame(game: GameState | null): void {
  try {
    if (game) localStorage.setItem(KEY, JSON.stringify(game))
    else localStorage.removeItem(KEY)
  } catch {
    // Private mode or storage blocked: the game still plays, it just won't survive a reload.
  }
}
