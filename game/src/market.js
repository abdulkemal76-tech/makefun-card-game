// market.js — the face-up market row: four catch-of-the-day cards anyone
// can buy with coins. The row refreshes every round, so the tide and the
// market together decide what is worth buying, holding or selling.

import { cardCost } from './deck.js';

export const MARKET_SIZE = 4;

/** Deal a fresh market row from the deck (mutates the deck). */
export function freshMarket(deck, rng) {
  const row = [];
  while (row.length < MARKET_SIZE && deck.length > 0) row.push(deck.pop());
  return row;
}

/** Refill the row to full after a purchase, drawing from the deck. */
export function refillMarket(deck, row) {
  while (row.length < MARKET_SIZE && deck.length > 0) row.push(deck.pop());
  return row;
}

/** Can the buyer afford this card? */
export function canAfford(coins, card) {
  return coins >= cardCost(card);
}

/** Buy the card at row index: pay its cost, take it into the hand, refill. */
export function buyFromMarket(state, index) {
  const card = state.market[index];
  if (!card) return { ok: false, reason: 'No card in that market slot.' };
  const cost = cardCost(card);
  if (state.coins.you < cost) return { ok: false, reason: `That card costs ${cost} coins.` };
  state.coins.you -= cost;
  state.market.splice(index, 1);
  state.hand.push(card);
  refillMarket(state.deck, state.market);
  return { ok: true, card, cost };
}

/** Haggle: trade a hand card away for its value + 3 coins, once per round. */
export function haggleCard(state, handIndex) {
  if (state.haggledThisRound) return { ok: false, reason: 'You already haggled this round.' };
  const card = state.hand[handIndex];
  if (!card) return { ok: false, reason: 'No card in that hand slot.' };
  const gain = card.kind === 'number' ? card.value + 3 : 8;
  state.hand.splice(handIndex, 1);
  state.coins.you += gain;
  state.haggledThisRound = true;
  return { ok: true, card, gain };
}
