# Kizuna Quiz

Perguntas para criar conexão: a question-card game for couples. One phone on the table shows one card at a time, both of you answer it, and no card comes back within a game. No backend, no account, and nothing either of you says is stored.

Static React + Vite PWA, hosted on Netlify. Works offline after the first visit.

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

To run the same e2e tests against the live site: `BASE_URL=https://kizuna-quiz.netlify.app npm run test:e2e`.

## Deploy

In Netlify: **Add new site → Import an existing project → GitHub → kizuna-app**, then **Deploy**. The build settings come from [netlify.toml](netlify.toml) (`npm run build`, publish `dist`, Node 22), so nothing needs filling in. Every push to `main` redeploys.

Security headers live in [public/_headers](public/_headers). Their strict script policy also keeps Netlify's “Powered by Netlify” badge from rendering, since it would sit over the Respondi button. You can also switch the badge off in Netlify under Project configuration → General → Powered by Netlify badge.

Live at https://kizuna-quiz.netlify.app. Open it on your phone. To use it like an app: Safari → Share → Adicionar à Tela de Início, or Chrome → ⋮ → Instalar app.

## How it works

- **One game, 48 cards in three rounds** (15, 17 and 16), each round more personal, built on the 36 questions of Aron et al. (1997) plus questions about the long term (family, home, money, conflict, children). It ends with an optional two-minute eye-contact screen.
- **The five-qualities card** (`"together": true`) is played by both within one card: each Respondi passes the turn, five qualities each, as in the original "alternate sharing" item.
- **Cards** live in [src/data/cards.json](src/data/cards.json). Each card has a `round` and a `theme`. `{masc|fem}` pairs adapt to whoever is answering; `{parceiro}` becomes the other player's name.
- **No repeats by construction.** [src/game/deck.ts](src/game/deck.ts) shuffles the deck once per game from a 20-bit seed (mulberry32 + Fisher–Yates), round by round unless random order is chosen. Within a round, passado, presente and futuro take turns (never the same theme twice in a row); random order only avoids three in a row. The game only moves a pointer forward; passed cards are never dealt again.
- **State** is a reducer ([src/game/reducer.ts](src/game/reducer.ts)) saved to `localStorage` on every change, so closing the tab or locking the phone keeps the game. Undo pops up to 10 snapshots without reshuffling. A saved game that fails validation offers a new game instead of crashing.
- **Couple features:** turn banner, alternating first answerer, table mode (the card rotates 180° toward the second player), follow-up behind a tap, screen wake lock with an auto-lock tip as fallback, and an optional two-minute eye-contact finale.

## v1.1 extras

- **Two phones.** "Jogar em dois celulares" on any round intro shows a 4-character code (the 20-bit seed in Crockford base32, see [src/game/gameCode.ts](src/game/gameCode.ts)) and a share link like `/#g=K7Q2&o=r`. The hash carries seed and order (`o=r` por rodada, `o=a` aleatória), and browsers never send it to the server. The other phone opens the link, or taps "Entrar com código", enters the same names in the same order and gets the identical deck. Each phone taps forward on its own.
- **Round timer.** A thin bar under the header fills over about 20 minutes per round (60 for a mixed game). It never interrupts.
- **Haptics.** A 30 ms vibration when the turn passes to the other player. Android only: iOS Safari has no Vibration API.
