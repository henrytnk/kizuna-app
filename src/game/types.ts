/** Rounds 1–3 build closeness, each more personal; round 4 is Nosso futuro, about the long term. */
export type Round = 1 | 2 | 3 | 4
export type Theme = 'passado' | 'presente' | 'futuro'

export interface Card {
  id: string
  round: Round
  theme: Theme
  /**
   * Both answer within one card, taking turns, as in the original procedure's
   * "alternate sharing… a total of five items". Its text has no {masc|fem} or {parceiro}.
   */
  together?: boolean
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

/** 'listed' deals the approved list in order; 'random' shuffles rounds 1–3. */
export type Order = 'listed' | 'random'

export type Phase = 'round-intro' | 'card' | 'eye-contact' | 'done'

export interface GameState {
  version: 3
  /** 20-bit integer; also the game code for a second phone. */
  seed: number
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
