export type Round = 1 | 2 | 3
/** 'conexao' is the 36-question closeness game; 'futuro' is Nosso futuro, about the long term. */
export type Mode = 'conexao' | 'futuro'
export type Theme = 'passado' | 'presente' | 'futuro'

export interface Card {
  id: string
  mode: Mode
  /** Nosso futuro uses rounds 1 (lighter) and 2 (deeper) to order its cards, under a single intro. */
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
  version: 2
  /** 20-bit integer; also the game code for a second phone. */
  seed: number
  mode: Mode
  order: Order
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
