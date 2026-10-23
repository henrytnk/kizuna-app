# Kizuna

Perguntas para criar conexão: a question-card game for couples. One phone on the table shows one card at a time, both of you answer it, and no card comes back within a game. No backend, no account, and nothing either of you says is stored.

Static React + Vite PWA, served from Cloudflare Workers static assets. Works offline after the first visit.

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test             # Vitest: deck engine, render, reducer, saved-game parsing
npm run test:e2e     # Playwright: full game on a phone viewport, offline reload, two-phone code
```

The first e2e run needs a browser: `npx playwright install chromium`.

## Deploy

```bash
npx wrangler login   # once
npm run deploy       # build + wrangler deploy → https://kizuna.<your-subdomain>.workers.dev
```

## How it works

- **Cards** live in [src/data/cards.json](src/data/cards.json): 10 + 10 + 9 cards across three rounds, plus one optional bonus card. `{masc|fem}` pairs adapt to whoever is answering; `{parceiro}` becomes the other player's name.
- **No repeats by construction.** [src/game/deck.ts](src/game/deck.ts) shuffles the deck once per game from a 20-bit seed (mulberry32 + Fisher–Yates), round by round unless random order is chosen, and reshuffles a round if one theme would come up three times in a row. The game only moves a pointer forward; passed cards are never dealt again.
- **State** is a reducer ([src/game/reducer.ts](src/game/reducer.ts)) saved to `localStorage` on every change, so closing the tab or locking the phone keeps the game. Undo pops up to 10 snapshots without reshuffling. A saved game that fails validation offers a new game instead of crashing.
- **Couple features:** turn banner, alternating first answerer, table mode (the card rotates 180° toward the second player), follow-up behind a tap, screen wake lock with an auto-lock tip as fallback, and an optional two-minute eye-contact finale.

## v1.1 extras

- **Two phones.** "Jogar em dois celulares" on any round intro shows a 4-character code (the 20-bit seed in Crockford base32, see [src/game/gameCode.ts](src/game/gameCode.ts)) and a share link like `/#g=K7Q2&o=r&b=0`. The hash carries seed, order (`r` por rodada, `a` aleatória) and bonus, and browsers never send it to the server. The other phone opens the link, or taps "Entrar com código", enters the same names in the same order and gets the identical deck. Each phone taps forward on its own.
- **Round timer.** A thin bar under the header fills over about 15 minutes per round (45 for a mixed game, 5 for the bonus card). It never interrupts.
- **Haptics.** A 30 ms vibration when the turn passes to the other player. Android only: iOS Safari has no Vibration API.
