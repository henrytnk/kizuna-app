import type { GameState } from './types'

/** Crockford base32: no I, L, O or U, so a code read aloud or typed by hand is hard to get wrong. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CODE_LENGTH = 4 // 4 × 5 bits = the 20-bit seed

export type Invite = Pick<GameState, 'seed' | 'order'>

export function encodeSeed(seed: number): string {
  let code = ''
  for (let i = CODE_LENGTH - 1; i >= 0; i--) code += ALPHABET[(seed >>> (i * 5)) & 31]
  return code
}

export function decodeCode(input: string): number | null {
  const code = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
  if (code.length !== CODE_LENGTH) return null
  let seed = 0
  for (const ch of code) {
    const v = ALPHABET.indexOf(ch)
    if (v < 0) return null
    seed = seed * 32 + v
  }
  return seed
}

/** `#g=K7Q2&o=r`: the hash never reaches the server. o is r (na ordem) or a (aleatória). */
export function inviteHash(i: Invite): string {
  return `#g=${encodeSeed(i.seed)}&o=${i.order === 'random' ? 'a' : 'r'}`
}

export function parseInviteHash(hash: string): Invite | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const seed = decodeCode(params.get('g') ?? '')
  if (seed === null) return null
  return { seed, order: params.get('o') === 'a' ? 'random' : 'listed' }
}
