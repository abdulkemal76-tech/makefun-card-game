// tide.js — the tide is the table's visible force. It marches through four
// phases, one per round, and each phase makes one suit strong (double coins
// when sold) and the suit across the canal weak (half coins, at least 1).
// The tide gauge on the table always shows where the water is and what it
// does to every suit, so the player can plan around it instead of guessing.

export const TIDE_PHASES = [
  { key: 'low',     name: 'LOW TIDE',     water: 0.18, strong: 'fish',    weak: 'lantern', blurb: 'Fish are fat — Shells sleep' },
  { key: 'rising',  name: 'RISING TIDE',  water: 0.45, strong: 'shell',   weak: 'spice',   blurb: 'Shells wash in — Spice sinks' },
  { key: 'high',    name: 'HIGH TIDE',    water: 0.82, strong: 'lantern', weak: 'fish',    blurb: 'Lanterns blaze — Fish flee' },
  { key: 'falling', name: 'FALLING TIDE', water: 0.55, strong: 'spice',   weak: 'shell',   blurb: 'Spice runs hot — Shells dry out' },
];

/** Phase for a round number (round 1 starts at LOW TIDE). */
export function tideForRound(round) {
  return TIDE_PHASES[(round - 1) % TIDE_PHASES.length];
}

/** The phase opposite the given one — what a Storm card flips the tide to. */
export function oppositeTide(phase) {
  const idx = TIDE_PHASES.findIndex((p) => p.key === phase.key);
  return TIDE_PHASES[(idx + 2) % TIDE_PHASES.length];
}

/** Coin bonus for selling a card of this suit under this tide phase:
 * the strong suit pays +3, the weak suit −2, the others face value.
 * An additive bonus keeps one great card from winning the whole game. */
export function tideBonus(phase, suit) {
  if (suit === phase.strong) return 3;
  if (suit === phase.weak) return -2;
  return 0;
}

/** Coins earned by selling a numbered card under this tide phase. */
export function sellValue(phase, card) {
  if (card.kind !== 'number') return 0;
  return Math.max(1, card.value + tideBonus(phase, card.suit));
}

/** Human-readable tide effect line, e.g. "Lantern +3 · Fish −2". */
export function tideEffectLine(phase) {
  const strongName = phase.strong[0].toUpperCase() + phase.strong.slice(1);
  const weakName = phase.weak[0].toUpperCase() + phase.weak.slice(1);
  return `${strongName} +3  ·  ${weakName} −2`;
}
