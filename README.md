# Tide Market — a card duel on a rising tide

[![make.fun bounty](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/abdulkemal76-tech/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/abdulkemal76-tech/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Tide Market** is an original card duel set in a floating night market,
built for the make.fun bounty
[“Make the best card game”](https://make.fun/bounty/best-card-game-20261122-1826).
You are a stall-keeper duelling the rival Madam Coral across the canal.

## How to play

- **The tide rules the table.** Every round the tide shifts through
  Low → Rising → High → Falling, and each phase makes one suit pay **+3**
  while the opposite suit pays **−2**. Sell the right suit at the right tide.
- **Catch of the day.** A face-up market row of four cards is always on
  offer — buy them with coins to build a better hand.
- **Haggle.** Trade a card away for extra coins (once per round).
- **Special cards.** Haggle, Net (take a market card free) and Storm
  (flip the tide now).
- **Win** by reaching **21 coins**, or by bankrupting Madam Coral.
  You get 3 actions per round; Madam Coral plays her turn in the open,
  and her last played card stays face-up on the table, so you can read
  her and counter her.

## Controls

- Mouse: click cards and buttons. Keyboard: `1–5` select a hand card,
  `Enter` sell, `B` buy, `H` haggle, `N` end round, `Esc` pause, `M` mute.
- Sounds are synthesized with WebAudio — no audio files, no network.

## Play it

Open `game/index.html` in desktop Chrome (serve the `game/` folder with
any static server, e.g. `python3 -m http.server`). The game is fully
offline: every asset is a file under `game/`.

Screenshot staging: `?shot=start|play|win|lose` and `?seed=N`
(e.g. `game/index.html?shot=play&seed=7`).

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/`
  to the output directory and writes `dossier.json`.
- `game/index.html` — the canvas page.
- `game/src/deck.js` — deck, suits, seeded RNG.
- `game/src/tide.js` — tide phases and sell values.
- `game/src/market.js` — market row, buying, haggling.
- `game/src/ai.js` — Madam Coral's turns.
- `game/src/audio.js` — WebAudio sounds.
- `game/src/render.js` — all canvas drawing.
- `game/src/main.js` — state machine, input, game loop.
- `game/src/shots.js` — `?shot=` staging states.
- `screenshots/` — title, mid-game, win and loss screens.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see [LICENSE](LICENSE).
