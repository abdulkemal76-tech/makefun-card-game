// deck.js — the cards of Tide Market: four suits, values 1-9, and special cards.
// A card is a plain object: { id, suit, value, kind } where kind is 'number'
// or one of the special kinds 'haggle' | 'net' | 'storm'.

export const SUITS = {
  fish:    { name: 'Fish',    colour: '#2dd4bf', dark: '#0f766e', glow: '#5eead4' },
  shell:   { name: 'Shell',   colour: '#f472b6', dark: '#9d174d', glow: '#f9a8d4' },
  lantern: { name: 'Lantern', colour: '#fbbf24', dark: '#92400e', glow: '#fde68a' },
  spice:   { name: 'Spice',   colour: '#a78bfa', dark: '#5b21b6', glow: '#c4b5fd' },
};

export const SUIT_KEYS = ['fish', 'shell', 'lantern', 'spice'];

export const SPECIAL_KINDS = {
  haggle: { name: 'Haggle', cost: 5, blurb: 'Trade a card for +3 coins' },
  net:    { name: 'Net',    cost: 5, blurb: 'Take a market card free' },
  storm:  { name: 'Storm',  cost: 5, blurb: 'Flip the tide now' },
};

/** Deterministic PRNG (mulberry32) so ?seed=N replays the same shuffle. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fresh 42-card deck and shuffle it with the given rng. */
export function makeDeck(rng) {
  const deck = [];
  let id = 0;
  for (const suit of SUIT_KEYS) {
    for (let value = 1; value <= 9; value++) {
      deck.push({ id: id++, suit, value, kind: 'number' });
    }
  }
  for (const kind of ['haggle', 'net', 'storm']) {
    for (let n = 0; n < 2; n++) {
      deck.push({ id: id++, suit: 'lantern', value: 0, kind });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

/** A card's printed cost: its value, or the special's flat cost. */
export function cardCost(card) {
  return card.kind === 'number' ? card.value : SPECIAL_KINDS[card.kind].cost;
}

/** A card's label for the log and the card face. */
export function cardLabel(card) {
  if (card.kind !== 'number') return SPECIAL_KINDS[card.kind].name;
  return `${SUITS[card.suit].name} ${card.value}`;
}

/** Draw n cards from the deck into a hand (mutates both arrays). */
export function drawCards(deck, hand, n) {
  while (hand.length < n && deck.length > 0) hand.push(deck.pop());
  return hand;
}

/** Sort a hand so suits group together, values ascending — easier to read. */
export function sortHand(hand) {
  const order = { fish: 0, shell: 1, lantern: 2, spice: 3 };
  hand.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'number' ? -1 : 1;
    if (a.suit !== b.suit) return order[a.suit] - order[b.suit];
    return a.value - b.value;
  });
  return hand;
}
