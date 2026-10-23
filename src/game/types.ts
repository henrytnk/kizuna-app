export type Round = 1 | 2 | 3 | 'bonus'
export type Theme = 'passado' | 'presente' | 'futuro'

export interface Card {
  id: string
  round: Round
  theme: Theme
  /** May contain {masc|fem} pairs and {parceiro}. */
  text: string
  followUp: string
}

/** 'm' = ele, 'f' = ela */
export type Form = 'm' | 'f'

export interface Player {
  name: string
  form: Form
}

export type Order = 'by-round' | 'random'

export type Phase = 'round-intro' | 'card' | 'eye-contact' | 'done'

export interface GameState {
  version: 1
  /** 20-bit integer; also the future game code for a second phone. */
  seed: number
  order: Order
  includeBonus: boolean
  players: [Player, Player]
  /** Card IDs in deal order. Built once per game, never rebuilt. */
  deck: string[]
  /** Current card. Only moves forward, except through undo. */
  index: number
  /** Answers already given on the current card. */
  answeredBy: 0 | 1
  passed: string[]
  phase: Phase
  tableMode: boolean
  /** When the current round's first card was dealt (ms since epoch), for the round timer bar. */
  roundStartedAt?: number
  /** Last 10 snapshots, oldest first. */
  undo: Snapshot[]
}

export type Snapshot = Omit<GameState, 'undo'>
