// ai.js — Madam Coral, the rival stall-keeper across the canal. She plays
// her turn in the open: the log narrates every move, so her choices can be
// read and countered. She sells her best tide-boosted card, buys from the
// market when a bargain is there, and haggles when she is short of coins.

import { cardCost, cardLabel, sortHand } from './deck.js';

/** The rival's whole turn, as a list of log lines plus the card she
 * last played face-up, so the player can read her choices on the table.
 * Mutates the rival state. */
export function rivalTurn(state, rng) {
  const lines = [];
  let lastCard = null;
  const phase = state.tide;
  const hand = state.rivalHand;

  // She sells one card — a random one from her hand, not always her best,
  // and at face value: she does not read the tide the way you do, so the
  // tide bonus is the player's edge, not hers.
  const numbered = hand.filter((c) => c.kind === 'number');
  if (numbered.length > 0) {
    const pick = numbered[Math.floor(rng() * numbered.length)];
    const value = pick.value;
    hand.splice(hand.indexOf(pick), 1);
    state.coins.rival += value;
    lastCard = pick;
    lines.push(`Madam Coral sells ${cardLabel(pick)} for ${value} coins.`);
  }

  // She buys the cheapest market card only when it is cheap and she can pay.
  let bargain = null;
  let bargainCost = Infinity;
  for (const card of state.market) {
    const cost = cardCost(card);
    if (cost < bargainCost && cost <= 4 && state.coins.rival >= cost + 2) {
      bargainCost = cost;
      bargain = card;
    }
  }
  if (bargain && rng() < 0.5) {
    const idx = state.market.indexOf(bargain);
    state.market.splice(idx, 1);
    state.coins.rival -= bargainCost;
    state.rivalHand.push(bargain);
    lastCard = bargain;
    lines.push(`Madam Coral buys ${cardLabel(bargain)} from the market for ${bargainCost}.`);
    const refill = state.deck.pop();
    if (refill) state.market.push(refill);
  } else if (state.coins.rival <= 4 && hand.length > 0) {
    // Short of coins: she haggles a low card away, like any trader would.
    sortHand(hand);
    const low = hand[0];
    hand.splice(0, 1);
    const gain = low.kind === 'number' ? low.value + 3 : 8;
    state.coins.rival += gain;
    lastCard = low;
    lines.push(`Madam Coral haggles away ${cardLabel(low)} for ${gain} coins.`);
  }

  if (lines.length === 0) lines.push('Madam Coral eyes the market and passes.');
  return { lines, lastCard };
}
