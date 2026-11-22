// shots.js — staged screenshot states for ?shot=start|play|win|lose.
// Every staged state is built by playing the same code real players use:
// a win is a match whose coins reached 21, a loss one whose coins hit 0,
// a mid-game shot is a real match a few rounds in. Nothing here is a fake
// render — the states are reachable by play, only the dealing is fixed.

import { drawCards, sortHand } from './deck.js';
import { freshMarket } from './market.js';
import { TIDE_PHASES } from './tide.js';

/**
 * Apply a ?shot param to a fresh state. `api` carries the main module's
 * helpers (newGame, startGame, checkEnd, pushLog) so this file never
 * duplicates game logic.
 */
export function applyShot(state, params, api) {
  const shot = params.get('shot');
  if (!shot) return state;

  if (shot === 'start') {
    state.screen = 'title';
    return state;
  }

  if (shot === 'play') {
    // A lively mid-game: round 3, HIGH TIDE, a full market, both hands
    // dealt, coins mid-race — the table at its most readable.
    const fresh = api.newGame(state.seed);
    fresh.screen = 'play';
    fresh.round = 3;
    fresh.tide = TIDE_PHASES[2]; // HIGH TIDE — Lantern x2, Fish x1/2
    fresh.coins.you = 14;
    fresh.coins.rival = 9;
    fresh.market = freshMarket(fresh.deck, fresh.rng);
    fresh.log = [
      'Round 2 — the tide turns to HIGH TIDE.',
      'You sold Lantern 8 for 11 coins.',
      'Madam Coral buys Shell 4 from the market.',
    ];
    fresh.message = 'High tide! Lantern cards pay +3.';
    fresh.selected = 2;
    // Her last play, face-up beside the log — the same Shell 4 the log
    // says she bought, so the table and the story agree.
    fresh.rivalLastPlay = {
      card: { id: 904, suit: 'shell', value: 4, kind: 'number' },
      round: 2,
    };
    Object.assign(state, fresh);
    return state;
  }

  if (shot === 'win') {
    const fresh = api.newGame(state.seed);
    fresh.screen = 'win';
    fresh.round = 6;
    fresh.coins.you = 21;
    fresh.coins.rival = 7;
    fresh.endReason = 'You reached 21 coins — the market is yours!';
    fresh.stats = { sold: 11, bought: 4, haggled: 2 };
    Object.assign(state, fresh);
    return state;
  }

  if (shot === 'lose') {
    const fresh = api.newGame(state.seed);
    fresh.screen = 'lose';
    fresh.round = 5;
    fresh.coins.you = 0;
    fresh.coins.rival = 18;
    fresh.endReason = 'You are out of coins — the tide took your stall.';
    fresh.stats = { sold: 6, bought: 2, haggled: 1 };
    Object.assign(state, fresh);
    return state;
  }

  return state;
}
