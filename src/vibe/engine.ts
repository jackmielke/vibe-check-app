import { analysisLine } from './copy';
import type { FactorLabel, VibeFactor, VibeResult } from './types';

/** Deterministic PRNG from a string seed. */
function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp01(n: number) {
  return Math.max(0.08, Math.min(0.98, n));
}

function uniqueScore(raw: number, rng: () => number): number {
  // Map continuous vibe into a punchier 0–100 with mild jitter.
  const base = Math.round(raw * 100);
  const jitter = Math.floor((rng() - 0.5) * 6);
  return Math.max(12, Math.min(99, base + jitter));
}

export type AnalyzeInput = {
  uri: string;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
};

/**
 * Fun, on-device vibe score inspired by VibeCheck's rubric.
 * Factors stay relatively ranked; headline score matches the blend.
 * (Later we can swap in real Vision / AI — copy + flow already fit.)
 */
export function analyzeVibe(input: AnalyzeInput): VibeResult {
  const hour = new Date().getHours();
  const seed = hashSeed(
    `${input.uri}|${input.width ?? 0}x${input.height ?? 0}|${input.fileSize ?? 0}|${hour}`
  );
  const rng = mulberry32(seed);

  // Soft priors: golden hours lift lighting; portrait aspect helps framing.
  const portraitBoost =
    input.width && input.height && input.height > input.width ? 0.08 : 0;
  const lightingHour =
    hour >= 7 && hour <= 10 ? 0.12 : hour >= 16 && hour <= 19 ? 0.15 : hour >= 22 || hour < 5 ? -0.08 : 0;

  const lighting = clamp01(0.45 + rng() * 0.45 + lightingHour);
  const smile = clamp01(0.35 + rng() * 0.55);
  const energy = clamp01(0.4 + rng() * 0.5);
  const framing = clamp01(0.4 + rng() * 0.45 + portraitBoost);
  const charisma = clamp01(0.42 + rng() * 0.48);

  const factors: VibeFactor[] = (
    [
      ['Lighting', lighting],
      ['Smile', smile],
      ['Energy', energy],
      ['Framing', framing],
      ['Charisma', charisma],
    ] as [FactorLabel, number][]
  ).map(([label, value]) => ({ label, value }));

  const weighted =
    lighting * 0.18 +
    smile * 0.22 +
    energy * 0.22 +
    framing * 0.16 +
    charisma * 0.22;

  const score = uniqueScore(weighted, rng);
  const analysis = analysisLine(score, factors, rng);

  return { score, analysis, factors };
}

/** Fake latency so the reveal feels intentional. */
export function analyzeVibeAsync(input: AnalyzeInput, ms = 2200): Promise<VibeResult> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(analyzeVibe(input)), ms);
  });
}
