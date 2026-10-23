import type { Player } from './types'

/** {m|f} picks the current answerer's form; {parceiro} is the other player's name. */
export const render = (text: string, me: Player, other: Player) =>
  text
    .replaceAll('{parceiro}', other.name)
    .replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m: string, f: string) => (me.form === 'm' ? m : f))
