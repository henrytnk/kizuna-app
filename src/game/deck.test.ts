import { describe, expect, it } from 'vitest'
import { CARDS, getCard } from './cards'
import { buildDeck, hasThemeRun, mulberry32, newSeed } from './deck'
import { render } from './render'
import type { Mode, Order, Player } from './types'

const SEEDS = Array.from({ length: 10_000 }, (_, i) => Math.floor(mulberry32(i + 1)() * 2 ** 20))
const SETTINGS: { mode: Mode; order: Order }[] = [
  { mode: 'conexao', order: 'by-round' },
  { mode: 'conexao', order: 'random' },
  { mode: 'futuro', order: 'by-round' },
]
const SIZE: Record<Mode, number> = { conexao: 36, futuro: 11 }

describe('cards.json', () => {
  it('has 12 + 12 + 12 closeness cards, like the original 36 questions, and 5 + 6 in Nosso futuro', () => {
    const count = (mode: Mode, r: number) => CARDS.filter((c) => c.mode === mode && c.round === r).length
    expect([count('conexao', 1), count('conexao', 2), count('conexao', 3)]).toEqual([12, 12, 12])
    expect([count('futuro', 1), count('futuro', 2), count('futuro', 3)]).toEqual([5, 6, 0])
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length)
  })
})

describe('buildDeck', () => {
  it.each(SETTINGS)('contains every card exactly once for 10,000 seeds (%o)', (s) => {
    const expected = SIZE[s.mode]
    for (const seed of SEEDS) {
      const deck = buildDeck(CARDS, { seed, ...s })
      expect(deck.length).toBe(expected)
      expect(new Set(deck).size).toBe(expected)
    }
  })

  it.each(SETTINGS)('is deterministic for the same seed and settings (%o)', (s) => {
    for (const seed of SEEDS.slice(0, 500)) {
      expect(buildDeck(CARDS, { seed, ...s })).toEqual(buildDeck(CARDS, { seed, ...s }))
    }
  })

  it('differs between seeds', () => {
    const a = buildDeck(CARDS, { seed: 1, mode: 'conexao', order: 'random' })
    const b = buildDeck(CARDS, { seed: 2, mode: 'conexao', order: 'random' })
    expect(a).not.toEqual(b)
  })

  it.each(['conexao', 'futuro'] as const)('deals rounds in order 1 → 2 → 3 (%s)', (mode) => {
    for (const seed of SEEDS.slice(0, 2000)) {
      const rounds = buildDeck(CARDS, { seed, mode, order: 'by-round' }).map((id) => getCard(id).round)
      expect(rounds).toEqual([...rounds].sort((x, y) => x - y))
    }
  })

  it('keeps each game to its own cards', () => {
    for (const seed of SEEDS.slice(0, 500)) {
      for (const s of SETTINGS) {
        expect(buildDeck(CARDS, { seed, ...s }).every((id) => getCard(id).mode === s.mode)).toBe(true)
      }
    }
  })

  it('alternates themes within each round: never the same theme twice in a row', () => {
    for (const seed of SEEDS) {
      const deck = buildDeck(CARDS, { seed, mode: 'conexao', order: 'by-round' }).map(getCard)
      for (const r of [1, 2, 3]) expect(hasThemeRun(deck.filter((c) => c.round === r), 2)).toBe(false)
    }
  })

  it('never deals one theme three times in a row in random order', () => {
    for (const seed of SEEDS) {
      const mixed = buildDeck(CARDS, { seed, mode: 'conexao', order: 'random' }).map(getCard)
      expect(hasThemeRun(mixed)).toBe(false)
    }
  })

  it('makes 20-bit seeds', () => {
    for (let i = 0; i < 1000; i++) {
      const s = newSeed()
      expect(Number.isInteger(s) && s >= 0 && s < 2 ** 20).toBe(true)
    }
  })
})

describe('render', () => {
  const ana: Player = { name: 'Ana', form: 'f' }
  const leo: Player = { name: 'Leo', form: 'm' }

  it('picks the answerer’s form and fills in the partner’s name', () => {
    const pr01 = getCard('pr-01')
    expect(render(pr01.text, leo, ana)).toBe('Conte o que você já gosta em Ana. Seja específico.')
    expect(render(pr01.text, ana, leo)).toBe('Conte o que você já gosta em Leo. Seja específica.')
  })

  it('leaves no braces in any card or follow-up, for either form', () => {
    for (const c of CARDS) {
      for (const [me, other] of [[ana, leo], [leo, ana], [ana, ana], [leo, leo]]) {
        expect(render(c.text, me, other)).not.toMatch(/[{}|]/)
        expect(render(c.followUp, me, other)).not.toMatch(/[{}|]/)
      }
    }
  })
})
