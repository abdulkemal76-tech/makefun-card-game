// main.js — the game loop, the state machine and the input: title, table,
// win and loss. It wires the deck, the tide, the market, the rival AI and
// the sounds together, and it owns the coin totals the player is racing.

import { makeDeck, makeRng, drawCards, sortHand, cardLabel, cardCost } from './deck.js';
import { tideForRound, oppositeTide, sellValue } from './tide.js';
import { freshMarket, buyFromMarket, haggleCard } from './market.js';
import { rivalTurn } from './ai.js';
import { makeAudio } from './audio.js';
import {
  W, H, handCardRect, marketCardRect, buttonRect, BUTTONS,
  drawTitle, drawTable, drawEnd,
} from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const audio = makeAudio();

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '7') || 7;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

/** A brand-new match, seeded so ?seed=N replays the same opening deal. */
export function newGame(seedValue) {
  const rng = makeRng(seedValue);
  const deck = makeDeck(rng);
  const state = {
    screen: 'title',
    paused: false,
    seed: seedValue,
    rng,
    deck,
    round: 1,
    tide: tideForRound(1),
    coins: { you: 6, rival: 6 },
    hand: [],
    rivalHand: [],
    market: [],
    log: ['Welcome to the floating night market.'],
    message: '',
    rivalLastPlay: null,
    selected: null,
    marketSelected: null,
    haggledThisRound: false,
    soldThisRound: false,
    actionsLeft: 3,
    dealAt: performance.now(),
    coinPulseAt: { you: 0, rival: 0 },
    endReason: '',
    stats: { sold: 0, bought: 0, haggled: 0 },
  };
  drawCards(deck, state.hand, 5);
  drawCards(deck, state.rivalHand, 5);
  state.market = freshMarket(deck, rng);
  sortHand(state.hand);
  return state;
}

let state = newGame(seed);

function say(text) {
  statusEl.textContent = text;
}

function pushLog(line) {
  state.log.push(line);
  if (state.log.length > 6) state.log.shift();
}

function checkEnd() {
  if (state.coins.you >= 21) {
    state.screen = 'win';
    state.endReason = 'You reached 21 coins — the market is yours!';
    audio.win();
  } else if (state.coins.rival <= 0) {
    state.screen = 'win';
    state.endReason = 'Madam Coral is bankrupt — the market is yours!';
    audio.win();
  } else if (state.coins.you <= 0) {
    state.screen = 'lose';
    state.endReason = 'You are out of coins — the tide took your stall.';
    audio.lose();
  } else if (state.coins.rival >= 21) {
    state.screen = 'lose';
    state.endReason = 'Madam Coral reached 21 coins first.';
    audio.lose();
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    state.selected = null;
    state.marketSelected = null;
    say(state.endReason);
  }
}

/** One action of the round: selling, buying and haggling each cost one of
 * the three actions a round allows, so a whole hand cannot be dumped in
 * a single tide and every round is a choice of what matters most. */
function spendAction() {
  if (state.actionsLeft <= 0) {
    state.message = 'No actions left this round — press N to end the round.';
    return false;
  }
  state.actionsLeft--;
  return true;
}

/** Sell the selected hand card for tide-adjusted coins. Only one sale a
 * round: the stall can only move one catch per tide, so the choice of
 * which card to sell — and what to do with the other actions — is the game. */
function sellSelected() {
  if (state.selected === null) return;
  const card = state.hand[state.selected];
  if (!card) return;
  if (state.soldThisRound) {
    state.message = 'You already sold this round — buy or haggle instead.';
    return;
  }
  if (card.kind === 'haggle') {
    state.message = 'Haggle is not sold — press H to trade it or another card.';
    return;
  }
  if (!spendAction()) return;
  state.soldThisRound = true;
  if (card.kind === 'net') {
    if (state.market.length === 0) {
      state.actionsLeft++;
      state.soldThisRound = false;
      state.message = 'No market card to net.';
      return;
    }
    let cheapest = 0;
    state.market.forEach((c, i) => {
      if (cardCost(c) < cardCost(state.market[cheapest])) cheapest = i;
    });
    const taken = state.market.splice(cheapest, 1)[0];
    state.hand.splice(state.selected, 1);
    state.hand.push(taken);
    const refill = state.deck.pop();
    if (refill) state.market.push(refill);
    state.selected = null;
    state.stats.bought++;
    pushLog(`You cast your Net and took ${cardLabel(taken)} free!`);
    audio.coin();
    checkEnd();
    return;
  }
  if (card.kind === 'storm') {
    state.tide = oppositeTide(state.tide);
    state.hand.splice(state.selected, 1);
    state.selected = null;
    pushLog(`Storm! The tide flips to ${state.tide.name}.`);
    state.message = `The tide flips to ${state.tide.name}!`;
    audio.storm();
    return;
  }
  const value = sellValue(state.tide, card);
  state.hand.splice(state.selected, 1);
  state.coins.you += value;
  state.coinPulseAt.you = performance.now();
  state.selected = null;
  state.stats.sold++;
  pushLog(`You sold ${cardLabel(card)} for ${value} coins.`);
  state.message = `Sold ${cardLabel(card)} for ${value} coins.`;
  audio.coin();
  checkEnd();
}

function buySelected() {
  if (state.marketSelected === null) return;
  if (!spendAction()) return;
  const result = buyFromMarket(state, state.marketSelected);
  if (!result.ok) {
    state.actionsLeft++; // a failed buy costs no action
    state.message = result.reason;
    return;
  }
  state.coinPulseAt.you = performance.now();
  state.marketSelected = null;
  state.stats.bought++;
  sortHand(state.hand);
  pushLog(`You bought ${cardLabel(result.card)} for ${result.cost} coins.`);
  state.message = `Bought ${cardLabel(result.card)} for ${result.cost} coins.`;
  audio.cardSnap();
  checkEnd();
}

function haggleSelected() {
  if (state.selected === null) return;
  if (state.soldThisRound) {
    state.message = 'You already traded this round — sell or haggle, not both.';
    return;
  }
  if (!spendAction()) return;
  const result = haggleCard(state, state.selected);
  if (!result.ok) {
    state.actionsLeft++; // a failed haggle costs no action
    state.message = result.reason;
    return;
  }
  state.soldThisRound = true; // a haggle is the round's one trade, like a sale
  state.coinPulseAt.you = performance.now();
  state.selected = null;
  state.stats.haggled++;
  pushLog(`You haggled ${cardLabel(result.card)} away for ${result.gain} coins.`);
  state.message = `Haggled ${cardLabel(result.card)} for ${result.gain} coins.`;
  audio.haggle();
  checkEnd();
}

/** End the round: the rival plays, the tide shifts, the market refreshes. */
function endRound() {
  if (state.screen !== 'play') return;
  audio.wave();
  const turn = rivalTurn(state, state.rng);
  turn.lines.forEach((line) => pushLog(line));
  if (turn.lastCard) state.rivalLastPlay = { card: turn.lastCard, round: state.round };
  state.coinPulseAt.rival = performance.now();
  checkEnd();
  if (state.screen !== 'play') return;
  state.round++;
  state.tide = tideForRound(state.round);
  state.haggledThisRound = false;
  state.soldThisRound = false;
  state.actionsLeft = 3;
  state.selected = null;
  state.marketSelected = null;
  drawCards(state.deck, state.hand, 5);
  drawCards(state.deck, state.rivalHand, 5);
  state.market = freshMarket(state.deck, state.rng);
  sortHand(state.hand);
  state.dealAt = performance.now();
  pushLog(`Round ${state.round} — the tide turns to ${state.tide.name}.`);
  state.message = `Round ${state.round}: ${state.tide.name}!`;
  if (state.deck.length < 6) {
    state.rng = makeRng(state.seed + state.round * 131);
    state.deck = makeDeck(state.rng);
    pushLog('A fresh catch arrives — the deck is shuffled anew.');
  }
  checkEnd();
}

function startGame() {
  state = newGame(seed);
  state.screen = 'play';
  state.message = 'Round 1: sell cards, buy the catch, reach 21 coins!';
  say('Round 1. Sell cards, buy from the market, reach 21 coins.');
  audio.unlock();
  audio.cardSnap();
}

function pointIn(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * W,
    y: ((e.clientY - rect.top) / rect.height) * H,
  };
}

canvas.addEventListener('click', (e) => {
  audio.unlock();
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    startGame();
    return;
  }
  if (state.paused) return;
  const p = canvasPoint(e);
  // buttons first
  for (let i = 0; i < BUTTONS.length; i++) {
    if (pointIn(buttonRect(i), p.x, p.y)) {
      const id = BUTTONS[i].id;
      if (id === 'sell') sellSelected();
      else if (id === 'buy') buySelected();
      else if (id === 'haggle') haggleSelected();
      else if (id === 'end') endRound();
      return;
    }
  }
  // market row
  for (let i = 0; i < state.market.length; i++) {
    if (pointIn(marketCardRect(i, state.market.length), p.x, p.y)) {
      state.marketSelected = state.marketSelected === i ? null : i;
      state.selected = null;
      audio.click();
      return;
    }
  }
  // hand
  for (let i = 0; i < state.hand.length; i++) {
    if (pointIn(handCardRect(i, state.hand.length), p.x, p.y)) {
      state.selected = state.selected === i ? null : i;
      state.marketSelected = null;
      audio.click();
      return;
    }
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    const muted = audio.toggleMute();
    state.message = muted ? 'Sound muted.' : 'Sound on.';
    return;
  }
  if (state.screen === 'title') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  if (e.key === 'Escape') {
    state.paused = !state.paused;
    return;
  }
  if (state.paused) return;
  if (e.key >= '1' && e.key <= '9') {
    const i = Number(e.key) - 1;
    if (i < state.hand.length) {
      state.selected = state.selected === i ? null : i;
      state.marketSelected = null;
      audio.click();
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    sellSelected();
  } else if (e.key === 'b' || e.key === 'B') {
    buySelected();
  } else if (e.key === 'h' || e.key === 'H') {
    haggleSelected();
  } else if (e.key === 'n' || e.key === 'N') {
    endRound();
  }
});

// Staged screenshot states (?shot=start|play|win|lose) — built through the
// same state machine real play uses, so every shot is a reachable position.
applyShot(state, params, { newGame, startGame, checkEnd, pushLog });

// The render loop.
function frame(t) {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') drawTitle(ctx, t);
  else if (state.screen === 'win' || state.screen === 'lose') drawEnd(ctx, state, t);
  else drawTable(ctx, state, t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose the live state for automated play-testing.
window.__tideMarket = {
  get state() { return state; },
  startGame,
  sellSelected,
  buySelected,
  haggleSelected,
  endRound,
  newGame,
};
