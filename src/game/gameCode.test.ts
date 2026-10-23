import { describe, expect, it } from 'vitest'
import { decodeCode, encodeSeed, inviteHash, parseInviteHash } from './gameCode'
import { createGame } from './reducer'
import type { GameState } from './types'

describe('game code', () => {
  it('round-trips every 20-bit seed through 4 characters', () => {
    for (let seed = 0; seed < 2 ** 20; seed++) {
      const code = encodeSeed(seed)
      if (code.length !== 4 || decodeCode(code) !== seed) throw new Error(`seed ${seed} → ${code}`)
    }
  })

  it('forgives lowercase, spaces, hyphens and look-alike letters', () => {
    const seed = decodeCode('K7Q2')
    expect(seed).not.toBeNull()
    expect(decodeCode(' k7-q2 ')).toBe(seed)
    expect(decodeCode('O1IL')).toBe(decodeCode('0111'))
  })

  it('rejects codes of the wrong length or with letters outside the alphabet', () => {
    expect(decodeCode('K7Q')).toBeNull()
    expect(decodeCode('K7Q22')).toBeNull()
    expect(decodeCode('K7QU')).toBeNull()
    expect(decodeCode('')).toBeNull()
  })
})

describe('invite link', () => {
  it('carries seed, order and bonus', () => {
    expect(inviteHash({ seed: decodeCode('K7Q2')!, order: 'by-round', includeBonus: false })).toBe('#g=K7Q2&o=r&b=0')
    for (const invite of [
      { seed: 0, order: 'by-round', includeBonus: false },
      { seed: 2 ** 20 - 1, order: 'random', includeBonus: true },
      { seed: 54321, order: 'random', includeBonus: false },
    ] as const) {
      expect(parseInviteHash(inviteHash(invite))).toEqual(invite)
    }
  })

  it('ignores hashes that are not invites', () => {
    expect(parseInviteHash('')).toBeNull()
    expect(parseInviteHash('#about')).toBeNull()
    expect(parseInviteHash('#g=no-way!')).toBeNull()
  })

  it('gives the second phone the identical deck', () => {
    const players: GameState['players'] = [
      { name: 'Ana', form: 'f' },
      { name: 'Leo', form: 'm' },
    ]
    for (const seed of [1, 777, 99_999, 2 ** 20 - 1]) {
      for (const order of ['by-round', 'random'] as const) {
        const host = createGame({ players, order, includeBonus: true, seed })
        const invite = parseInviteHash(inviteHash(host))!
        expect(createGame({ players, ...invite }).deck).toEqual(host.deck)
      }
    }
  })
})
