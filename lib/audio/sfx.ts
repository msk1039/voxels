/**
 * Tiny chiptune sound effects synthesised with WebAudio: square and
 * triangle oscillators plus a noise burst. No audio files are loaded.
 * The AudioContext is created lazily, on the first sound, which always
 * follows a user gesture.
 */

export type SfxName =
  | "click"
  | "key"
  | "run"
  | "error"
  | "miss"
  | "success"
  | "block"
  | "levelUp"
  | "achievement"
  | "locked"
  | "pop";

interface SfxOptions {
  enabled: boolean;
  volume: number;
}

let options: SfxOptions = { enabled: true, volume: 0.6 };
let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let lastKey = 0;

export function setSfxOptions(next: SfxOptions) {
  options = next;
  if (master) master.gain.value = next.volume * 0.35;
}

function audio() {
  if (typeof window === "undefined" || !options.enabled) return null;
  if (!context) {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = options.volume * 0.35;
    master.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(
  ctx: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  {
    type = "square",
    gain = 0.5,
    slideTo,
  }: { type?: OscillatorType; gain?: number; slideTo?: number } = {}
) {
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  }
  envelope.gain.setValueAtTime(gain, start);
  // A short linear tail avoids clicks without softening the chiptune attack.
  envelope.gain.setValueAtTime(gain, start + duration * 0.7);
  envelope.gain.linearRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(master!);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function noise(ctx: AudioContext, start: number, duration: number, gain = 0.3) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  const envelope = ctx.createGain();
  source.buffer = noiseBuffer;
  envelope.gain.setValueAtTime(gain, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(envelope).connect(master!);
  source.start(start);
  source.stop(start + duration);
}

function notes(
  ctx: AudioContext,
  frequencies: number[],
  step: number,
  type: OscillatorType = "square",
  gain = 0.4
) {
  const now = ctx.currentTime;
  frequencies.forEach((frequency, index) => {
    const last = index === frequencies.length - 1;
    tone(ctx, now + index * step, frequency, last ? step * 2.5 : step * 0.95, {
      type,
      gain,
    });
  });
}

export function playSfx(name: SfxName) {
  if (name === "key") {
    const now = typeof performance === "undefined" ? 0 : performance.now();
    if (now - lastKey < 45) return;
    lastKey = now;
  }
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;

  switch (name) {
    case "click":
      tone(ctx, now, 660, 0.045, { gain: 0.25 });
      break;
    case "key":
      tone(ctx, now, 1100 + Math.random() * 300, 0.018, { gain: 0.08 });
      break;
    case "pop":
      tone(ctx, now, 440, 0.07, { type: "triangle", gain: 0.5, slideTo: 990 });
      break;
    case "run":
      notes(ctx, [330, 440, 660], 0.045, "triangle", 0.5);
      break;
    case "miss":
      notes(ctx, [440, 370], 0.08, "triangle", 0.45);
      break;
    case "error":
      tone(ctx, now, 190, 0.22, { gain: 0.35, slideTo: 95 });
      noise(ctx, now, 0.12, 0.15);
      break;
    case "success":
      notes(ctx, [523, 659, 784, 1047], 0.085);
      break;
    case "block":
      tone(ctx, now, 988, 0.06, { gain: 0.3 });
      tone(ctx, now + 0.06, 1319, 0.16, { gain: 0.3 });
      break;
    case "levelUp":
      notes(ctx, [523, 659, 784, 1047, 1319, 1568], 0.07, "square", 0.35);
      notes(ctx, [262, 330, 392, 523, 659, 784], 0.07, "triangle", 0.4);
      break;
    case "achievement":
      notes(ctx, [784, 988, 1175, 1568], 0.1, "square", 0.3);
      break;
    case "locked":
      tone(ctx, now, 110, 0.14, { gain: 0.45, slideTo: 70 });
      noise(ctx, now, 0.06, 0.2);
      break;
  }
}
