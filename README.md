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
npm run test:e2e     # Playwright: full game on a phone viewport, offline reload
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

## Not built yet (v1.1)

Second-phone game code and link, round timer bar, Android haptics. The seed is already 20-bit so it can encode as a 4-character game code.
