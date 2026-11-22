// render.js — every pixel of Tide Market, drawn on one canvas: the night
// sky, the lanterns, the canal with its visible water line, the tide gauge,
// the rival's hand, the market row, the player's hand, and the end screens.
// Suits are told apart by colour AND shape, never by text alone.

import { SUITS, SPECIAL_KINDS, cardCost, cardLabel } from './deck.js';
import { tideEffectLine } from './tide.js';

export const W = 1280;
export const H = 800;
export const CARD_W = 112;
export const CARD_H = 152;
export const MARKET_Y = 252;
export const HAND_Y = 504;
export const RIVAL_Y = 96;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function centreX(count, w, gap) {
  return (W - (count * w + (count - 1) * gap)) / 2;
}

export function handCardRect(i, count) {
  const x0 = centreX(count, CARD_W, 16);
  return { x: x0 + i * (CARD_W + 16), y: HAND_Y, w: CARD_W, h: CARD_H };
}

export function marketCardRect(i, count) {
  const x0 = centreX(count, CARD_W, 16);
  return { x: x0 + i * (CARD_W + 16), y: MARKET_Y, w: CARD_W, h: CARD_H };
}

export function rivalCardRect(i, count) {
  const w = 64;
  const h = 92;
  const x0 = centreX(count, w, 10);
  return { x: x0 + i * (w + 10), y: RIVAL_Y, w, h };
}

export const BUTTONS = [
  { id: 'sell',   label: 'SELL  [Enter]', hint: 'Sell selected card' },
  { id: 'buy',    label: 'BUY  [B]',      hint: 'Buy selected market card' },
  { id: 'haggle', label: 'HAGGLE  [H]',   hint: 'Trade a card for +3 coins' },
  { id: 'end',    label: 'END ROUND  [N]', hint: 'Rival plays, tide shifts' },
];

export function buttonRect(i) {
  const w = 190;
  const h = 44;
  const x0 = (W - (BUTTONS.length * w + (BUTTONS.length - 1) * 14)) / 2;
  return { x: x0 + i * (w + 14), y: 696, w, h };
}

/** Draw one suit's shape, centred at (cx, cy) with radius r, in colour. */
export function drawSuitSymbol(ctx, suit, cx, cy, r, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  if (suit === 'fish') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.8, cy);
    ctx.lineTo(cx - r * 1.5, cy - r * 0.55);
    ctx.lineTo(cx - r * 1.5, cy + r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#062a2a';
    ctx.beginPath();
    ctx.arc(cx + r * 0.45, cy - r * 0.12, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (suit === 'shell') {
    for (let k = -2; k <= 2; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + r * 0.7);
      ctx.arc(cx, cy + r * 0.7, r, a - 0.28, a + 0.28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.7, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (suit === 'lantern') {
    ctx.shadowColor = colour;
    ctx.shadowBlur = 18;
    rr(ctx, cx - r * 0.62, cy - r * 0.85, r * 1.24, r * 1.7, r * 0.3);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1b0f00';
    ctx.fillRect(cx - r * 0.3, cy - r * 1.05, r * 0.6, r * 0.22);
    ctx.fillRect(cx - r * 0.3, cy + r * 0.85, r * 0.6, r * 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // spice: a four-point star
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.22, cy - r * 0.22, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.22, cy + r * 0.22, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.22, cy + r * 0.22, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.22, cy - r * 0.22, cx, cy - r);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** One playable card face. `selected` lifts it; `dim` greys it out. */
export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const { selected = false, dim = false } = opts;
  const lift = selected ? -14 : 0;
  const y0 = y + lift;
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  const suit = SUITS[card.suit];
  const grad = ctx.createLinearGradient(x, y0, x, y0 + h);
  grad.addColorStop(0, '#fffdf5');
  grad.addColorStop(1, '#f3ead2');
  rr(ctx, x, y0, w, h, 12);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? '#fbbf24' : suit.colour;
  ctx.stroke();
  // suit ribbon across the top
  ctx.fillStyle = suit.colour;
  rr(ctx, x + 6, y0 + 6, w - 12, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2, y0 + 19);
  if (card.kind === 'number') {
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(String(card.value), x + w / 2, y0 + 74);
    drawSuitSymbol(ctx, card.suit, x + w / 2, y0 + 118, 20, suit.colour);
  } else {
    const spec = SPECIAL_KINDS[card.kind];
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(spec.name.toUpperCase(), x + w / 2, y0 + 62);
    drawSuitSymbol(ctx, card.suit, x + w / 2, y0 + 100, 16, suit.colour);
    ctx.fillStyle = '#57534e';
    ctx.font = '11px system-ui, sans-serif';
    wrapText(ctx, spec.blurb, x + w / 2, y0 + 122, w - 40, 13);
  }
  // cost badge, bottom-right
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(x + w - 18, y0 + h - 18, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(String(cardCost(card)), x + w - 18, y0 + h - 17);
  ctx.restore();
}

/** A face-down rival card back. */
export function drawCardBack(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#7c2d12');
  grad.addColorStop(1, '#431407');
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();
  rr(ctx, x + 7, y + 7, w - 14, h - 14, 7);
  ctx.strokeStyle = 'rgba(251,191,36,0.55)';
  ctx.stroke();
  drawSuitSymbol(ctx, 'lantern', x + w / 2, y + h / 2, 13, '#fbbf24');
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineH));
}

/** Night sky, stars, hanging lanterns, rooftops. */
function drawSky(ctx, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0b1026');
  grad.addColorStop(0.55, '#1e1b4b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 70; i++) {
    const x = (i * 173 + 41) % W;
    const y = (i * 97 + 23) % 210;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + i));
    ctx.globalAlpha = tw * 0.7;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  // moon — low on the right, clear of the rival coin pile above it and
  // of the tide gauge beside it, so nothing it lights ever overlaps a label
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(1058, 168, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e7d28a';
  ctx.beginPath();
  ctx.arc(1047, 160, 6, 0, Math.PI * 2);
  ctx.arc(1071, 178, 4, 0, Math.PI * 2);
  ctx.fill();
  // hanging lanterns
  for (let i = 0; i < 6; i++) {
    const x = 90 + i * 210;
    const sway = Math.sin(t / 1400 + i * 1.7) * 5;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + sway, 44);
    ctx.stroke();
    drawSuitSymbol(ctx, 'lantern', x + sway, 62, 15, i % 2 ? '#fbbf24' : '#f472b6');
  }
}

/** The canal band with a water line whose height follows the tide phase. */
function drawCanal(ctx, phase) {
  const top = 420;
  const depth = 50;
  const level = top + depth * (1 - phase.water);
  ctx.fillStyle = '#0c2b3a';
  ctx.fillRect(0, top, W, depth + 8);
  const grad = ctx.createLinearGradient(0, level, 0, top + depth);
  grad.addColorStop(0, '#2dd4bf');
  grad.addColorStop(1, '#0e7490');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, level);
  for (let x = 0; x <= W; x += 32) {
    ctx.lineTo(x, level + Math.sin(x / 90 + 1.2) * 3);
  }
  ctx.lineTo(W, top + depth + 8);
  ctx.lineTo(0, top + depth + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CANAL', 24, top + depth - 12);
}

/** The tide gauge: a vertical water column on the right of the table. */
function drawTideGauge(ctx, phase) {
  const x = 1212;
  const y = 88;
  const h = 290;
  const w = 44;
  ctx.save();
  ctx.fillStyle = 'rgba(2,6,23,0.65)';
  rr(ctx, x - 12, y - 34, w + 24, h + 76, 12);
  ctx.fill();
  ctx.fillStyle = '#e7e5e4';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TIDE', x + w / 2, y - 18);
  ctx.strokeStyle = '#78716c';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 8);
  ctx.stroke();
  const fillH = h * phase.water;
  const grad = ctx.createLinearGradient(0, y + h - fillH, 0, y + h);
  grad.addColorStop(0, '#5eead4');
  grad.addColorStop(1, '#0e7490');
  ctx.fillStyle = grad;
  rr(ctx, x + 2, y + h - fillH, w - 4, fillH - 2, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(phase.name, x + w / 2, y + h + 20);
  ctx.fillStyle = '#fde68a';
  ctx.font = '11px system-ui, sans-serif';
  wrapText(ctx, tideEffectLine(phase), x + w / 2, y + h + 36, w + 20, 13);
  ctx.restore();
}

function drawCoinPile(ctx, x, y, coins, label, big, pulseAt = 0, t = 0) {
  ctx.save();
  // A coin change pops the pile briefly, so a sale or a rival move lands.
  const p = Math.min(1, Math.max(0, (t - pulseAt) / 320));
  const scale = 1 + 0.22 * (1 - p) * (1 - p);
  ctx.translate(x + 14, y);
  ctx.scale(scale, scale);
  ctx.translate(-(x + 14), -y);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x + 14, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¢', x + 14, y + 1);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${big ? 30 : 20}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`${coins}`, x + 34, y);
  ctx.fillStyle = '#d6d3d1';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(label, x + 34, y + (big ? 24 : 18));
  ctx.restore();
}

/** A dealt card's entrance: staggered by index, it slides up and fades in
 * over ~280 ms, so a fresh round lands with weight instead of popping in. */
function entranceOffset(t, dealAt, i) {
  const p = Math.min(1, Math.max(0, (t - dealAt - i * 70) / 280));
  const eased = 1 - Math.pow(1 - p, 3);
  return { dy: (1 - eased) * 46, alpha: p };
}

function drawLog(ctx, lines) {  ctx.save();
  ctx.fillStyle = 'rgba(2,6,23,0.6)';
  rr(ctx, 24, 118, 340, 64, 10);
  ctx.fill();
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const shown = lines.slice(-3);
  shown.forEach((line, i) => ctx.fillText(line, 36, 126 + i * 20));
  ctx.restore();
}

/** The rival's last move, face-up beside the log: her choices stay on
 * the table where they can be read and countered, not just in the log.
 * Kept narrow (x 376–432) so it never touches the rival card backs. */
function drawRivalLastPlay(ctx, state) {
  const x = 376;
  const y = 112;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('LAST PLAY', x, y);
  if (!state.rivalLastPlay) {
    ctx.fillStyle = '#a8a29e';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('She has not played yet.', x, y + 20);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(x, y + 16);
  ctx.scale(0.5, 0.5);
  drawCard(ctx, state.rivalLastPlay.card, 0, 0, CARD_W, CARD_H);
  ctx.restore();
  ctx.fillStyle = '#d6d3d1';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`Round ${state.rivalLastPlay.round}`, x, y + 100);
  ctx.restore();
}

/** The title screen. */
export function drawTitle(ctx, t) {
  drawSky(ctx, t);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 30;
  ctx.fillText('TIDE MARKET', W / 2, 250);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#5eead4';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('a card duel on a rising tide', W / 2, 318);
  // three sample cards fanned out
  const sample = [
    { id: 901, suit: 'fish', value: 7, kind: 'number' },
    { id: 902, suit: 'lantern', value: 9, kind: 'number' },
    { id: 903, suit: 'shell', value: 5, kind: 'number' },
  ];
  sample.forEach((card, i) => {
    ctx.save();
    ctx.translate(W / 2 + (i - 1) * 140, 480);
    ctx.rotate((i - 1) * 0.08);
    drawCard(ctx, card, -CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
    ctx.restore();
  });
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const pulse = 0.65 + 0.35 * Math.sin(t / 400);
  ctx.globalAlpha = pulse;
  ctx.fillText('Press ENTER or click to play', W / 2, 660);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d6d3d1';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Sell cards · Buy the catch of the day · Haggle · Reach 21 coins or sink your rival', W / 2, 700);
  ctx.fillText('Keys: 1–5 select · Enter sell · B buy · H haggle · N end round · M mute', W / 2, 726);
  ctx.restore();
}

/** The main table. */
export function drawTable(ctx, state, t) {
  drawSky(ctx, t);
  const phase = state.tide;
  ctx.save();
  // top bar
  ctx.fillStyle = 'rgba(2,6,23,0.7)';
  ctx.fillRect(0, 0, W, 58);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('TIDE MARKET', 24, 30);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5eead4';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`${phase.name}  —  ${phase.blurb}`, W / 2, 22);
  ctx.fillStyle = '#fde68a';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(tideEffectLine(phase), W / 2, 44);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e7e5e4';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`ROUND ${state.round}  ·  ${state.actionsLeft} action${state.actionsLeft === 1 ? '' : 's'} left`, W - 24, 30);

  // rival zone
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('MADAM CORAL — rival stall-keeper', 24, 84);
  drawCoinPile(ctx, 1020, 84, state.coins.rival, 'rival coins', false, state.coinPulseAt.rival, t);
  state.rivalHand.forEach((_, i) => {
    const r = rivalCardRect(i, state.rivalHand.length);
    drawCardBack(ctx, r.x, r.y, r.w, r.h);
  });
  ctx.fillStyle = '#a8a29e';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.rivalHand.length} cards in hand`, W / 2, 204);

  // market row
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('CATCH OF THE DAY — the market row', 24, 232);
  ctx.fillStyle = '#a8a29e';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Click a card, then BUY. The tide decides what it is worth.', 430, 232);
  state.market.forEach((card, i) => {
    const r = marketCardRect(i, state.market.length);
    const selected = state.marketSelected === i;
    const afford = state.coins.you >= cardCost(card);
    const enter = entranceOffset(t, state.dealAt, i);
    ctx.save();
    ctx.globalAlpha = enter.alpha * (afford ? 1 : 0.45);
    ctx.translate(0, enter.dy);
    drawCard(ctx, card, r.x, r.y - (selected ? 12 : 0), r.w, r.h, { selected });
    ctx.restore();
  });

  drawCanal(ctx, phase);
  drawTideGauge(ctx, phase);

  // player zone
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5eead4';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('YOUR STALL — your hand', 24, 490);
  drawCoinPile(ctx, 1020, 490, state.coins.you, 'your coins', true, state.coinPulseAt.you, t);
  state.hand.forEach((card, i) => {
    const r = handCardRect(i, state.hand.length);
    const enter = entranceOffset(t, state.dealAt, i);
    ctx.save();
    ctx.globalAlpha = enter.alpha;
    ctx.translate(0, enter.dy);
    drawCard(ctx, card, r.x, r.y, r.w, r.h, { selected: state.selected === i });
    ctx.restore();
  });
  if (state.hand.length === 0) {
    ctx.fillStyle = '#a8a29e';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Your hand is empty — end the round to draw fresh cards.', W / 2, 620);
  }

  // action buttons
  BUTTONS.forEach((b, i) => {
    const r = buttonRect(i);
    const disabled = b.id === 'sell' && state.selected === null;
    const disabledBuy = b.id === 'buy' && state.marketSelected === null;
    const disabledHaggle = b.id === 'haggle' && (state.selected === null || state.haggledThisRound);
    const off = disabled || disabledBuy || disabledHaggle;
    ctx.save();
    ctx.globalAlpha = off ? 0.45 : 1;
    ctx.fillStyle = b.id === 'end' ? '#0e7490' : '#78350f';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, r.x + r.w / 2, r.y + r.h / 2);
    ctx.restore();
  });

  // hint + log + message
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d6d3d1';
  ctx.font = '13px system-ui, sans-serif';
  const hint = state.haggledThisRound
    ? 'Trade used · 1 trade per round · 3 actions · 1–5 select · Enter sell · B buy · N end round'
    : '1 trade (sell or haggle) per round · 3 actions · 1–5 select · Enter sell · B buy · H haggle · N end round';
  ctx.fillText(hint, W / 2, 762);
  if (state.message) {
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(state.message, W / 2, 672);
  }
  drawLog(ctx, state.log);
  drawRivalLastPlay(ctx, state);

  if (state.paused) {
    ctx.fillStyle = 'rgba(2,6,23,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 20);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Press Esc to resume · M to mute', W / 2, H / 2 + 30);
  }
  ctx.restore();
}

/** Win or loss screen. */
export function drawEnd(ctx, state, t) {
  drawSky(ctx, t);
  const won = state.screen === 'win';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = won ? '#fde68a' : '#fda4af';
  ctx.font = 'bold 76px Georgia, serif';
  ctx.shadowColor = won ? '#f59e0b' : '#7f1d1d';
  ctx.shadowBlur = 30;
  ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', W / 2, 220);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(won ? state.endReason : state.endReason, W / 2, 292);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#e7e5e4';
  ctx.fillText(`Final coins — You ${state.coins.you}  ·  Madam Coral ${state.coins.rival}`, W / 2, 350);
  ctx.fillText(`Rounds played: ${state.round}  ·  Cards sold: ${state.stats.sold}  ·  Bought: ${state.stats.bought}  ·  Haggled: ${state.stats.haggled}`, W / 2, 386);
  // coin pile flourish
  for (let i = 0; i < 9; i++) {
    const x = W / 2 + (i - 4) * 46;
    const bob = Math.sin(t / 300 + i) * 4;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, 470 + bob, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('¢', x, 471 + bob);
  }
  // The player's final hand, kept on the table: the end screen shows the
  // cards the match ended with, not just the numbers.
  if (state.hand && state.hand.length > 0) {
    ctx.fillStyle = '#a8a29e';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('Your final hand', W / 2, 524);
    const mw = 62;
    const mh = 84;
    const gap = 10;
    const total = state.hand.length * mw + (state.hand.length - 1) * gap;
    state.hand.forEach((card, i) => {
      ctx.save();
      ctx.translate((W - total) / 2 + i * (mw + gap), 538);
      ctx.scale(0.55, 0.55);
      drawCard(ctx, card, 0, 0, CARD_W, CARD_H);
      ctx.restore();
    });
  }
  const pulse = 0.65 + 0.35 * Math.sin(t / 400);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('Press ENTER to play again', W / 2, 668);
  ctx.globalAlpha = 1;
  ctx.restore();
}
