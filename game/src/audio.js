// audio.js — every sound is synthesized with WebAudio: no audio files, no
// network. A tiny coin chime, a card snap, a wave wash for the tide, a low
// gong for the win and a sad slide for the loss.

export function makeAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, when = 0, lowpass = 800) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const amp = ac.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(ac.destination);
    src.start(t0);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    click() { tone(660, 0.06, 'triangle', 0.12); },
    coin() { tone(1320, 0.1, 'sine', 0.16); tone(1760, 0.16, 'sine', 0.14, 0.07); },
    cardSnap() { noise(0.08, 0.2, 0, 2400); tone(220, 0.08, 'triangle', 0.1); },
    wave() { noise(0.7, 0.14, 0, 500); noise(0.5, 0.08, 0.15, 900); },
    haggle() { tone(520, 0.09, 'square', 0.07); tone(392, 0.09, 'square', 0.07, 0.09); tone(523, 0.14, 'square', 0.07, 0.18); },
    storm() { noise(0.5, 0.22, 0, 300); tone(110, 0.5, 'sawtooth', 0.08, 0, 55); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.16, i * 0.12)); },
    lose() { tone(392, 0.4, 'triangle', 0.14, 0, 262); tone(262, 0.7, 'triangle', 0.14, 0.3, 196); },
  };
}
