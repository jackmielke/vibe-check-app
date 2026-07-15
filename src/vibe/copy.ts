import type { FactorLabel, VibeFactor } from './types';

type Rng = () => number;

function pick<T>(rng: Rng, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

const strength: Record<FactorLabel, string[]> = {
  Lighting: [
    'That lighting is doing free PR for your face.',
    'Golden-hour energy without even trying.',
    'Whoever lit this scene deserves a raise.',
  ],
  Smile: [
    'That smile could end feuds and start group chats.',
    'The grin is genuinely carrying the entire frame.',
    'Certified contagious smile.',
  ],
  Energy: [
    'The eyes are wide awake and the energy is undeniable.',
    'Main-character energy radiating straight through the lens.',
    'Alert, alive, and clearly running on something good.',
  ],
  Framing: [
    'Framed like you have done this before.',
    'Perfectly poised composition.',
    'Composition so clean it belongs on a billboard.',
  ],
  Charisma: [
    'Pure charisma. The camera is obsessed with you.',
    'That is a magnetic frame.',
    'Effortless star quality leaking out of every pixel.',
  ],
};

const weakness: Record<FactorLabel, string[]> = {
  Lighting: [
    'the lighting is plotting against you, find a window.',
    'those shadows are a little too dramatic for the plot.',
    'the lighting said horror movie when you meant glow up.',
  ],
  Smile: [
    'the smile is on airplane mode, let it land.',
    'that expression is keeping secrets, give us a little grin.',
    'the face is buffering, crack a smile and reshoot.',
  ],
  Energy: [
    'the eyes are clocking out early, bring the energy.',
    'the vibe is mid-nap, wake it up a touch.',
    'looks like four hours of sleep talked you into this one.',
  ],
  Framing: [
    'the framing is freestyling, center yourself.',
    'the camera cannot find the main character yet.',
    'the composition is doing parkour, steady it up.',
  ],
  Charisma: [
    'the camera is still warming up to you.',
    'the aura is shy today, let it out.',
    'the frame needs a little more you in it.',
  ],
};

function tierCap(score: number, rng: Rng): string {
  if (score >= 90) return pick(rng, ['Absolutely elite.', 'Frame it.', 'Top-tier vibe, no notes.']);
  if (score >= 75) return pick(rng, ['Immaculate stuff.', 'Seriously strong vibe.', 'You ate this.']);
  if (score >= 60) return pick(rng, ['Solid vibe overall.', 'Certified cool.', 'We respect it.']);
  if (score >= 40) return pick(rng, ['Room to grow, but we see you.', 'Not bad, not legendary, yet.', 'Mid with potential.']);
  return pick(rng, ['We will allow a redo.', 'Run it back.', 'The vibe is recoverable.']);
}

export function analysisLine(score: number, factors: VibeFactor[], rng: Rng): string {
  const top = factors.reduce((a, b) => (a.value >= b.value ? a : b));
  const low = factors.reduce((a, b) => (a.value <= b.value ? a : b));
  const strong = pick(rng, strength[top.label]);
  const weak = pick(rng, weakness[low.label]);
  const cap = tierCap(score, rng);

  if (score >= 75) return `${strong} ${cap}`;
  if (score >= 55) return `${strong} But ${weak}`;
  return `${weak.charAt(0).toUpperCase()}${weak.slice(1)} ${cap}`;
}

export function analyzingLines(): string[] {
  return [
    'Reading the room…',
    'Checking the lighting conspiracy…',
    'Weighing the aura…',
    'Consulting the vibe council…',
  ];
}
