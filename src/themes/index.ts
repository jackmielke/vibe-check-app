import type { Theme, ThemeId } from './types';

export type { Theme, ThemeId, FontSpec } from './types';

/** The original editorial look: deep field green, gold horizon, serif italic. */
const field: Theme = {
  id: 'field',
  name: 'Field',
  bg: '#163A35',
  card: 'rgba(244,239,230,0.06)',
  cardBorder: 'rgba(244,239,230,0.14)',
  atmosphere: 'gradient',
  gradientColors: ['#163A35', '#1F4D45', '#2A6B58', '#C4A574'],
  gradientLocations: [0, 0.35, 0.68, 1],
  orb: 'rgba(255,214,160,0.55)',
  text: '#F4EFE6',
  textSoft: 'rgba(244,239,230,0.88)',
  textMuted: 'rgba(244,239,230,0.72)',
  accent: '#C4A574',
  onAccent: '#163A35',
  display: { fontFamily: 'Syne_800ExtraBold', letterSpacing: -2.5 },
  body: { fontFamily: 'InstrumentSerif_400Regular_Italic' },
  label: {
    fontFamily: 'Syne_700Bold',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  displayScale: 1,
  radius: 0,
  raised: false,
  photoWash: 0.35,
  photoScrim: 'rgba(22,58,53,0.55)',
};

/** Camera-app plainness: true black, white ink, nothing decorative. */
const real: Theme = {
  id: 'real',
  name: 'Real',
  bg: '#000000',
  card: '#141414',
  cardBorder: '#262626',
  atmosphere: 'flat',
  gradientColors: ['#000000', '#000000'],
  gradientLocations: [0, 1],
  orb: null,
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.82)',
  textMuted: 'rgba(255,255,255,0.5)',
  accent: '#FFFFFF',
  onAccent: '#000000',
  display: { fontWeight: '800', letterSpacing: -3 },
  body: { fontWeight: '400' },
  label: { fontWeight: '600', letterSpacing: 0.6 },
  displayScale: 1,
  radius: 14,
  raised: false,
  photoWash: 0.5,
  photoScrim: 'rgba(0,0,0,0.55)',
};

/** Neumorphic: one soft grey plane, shapes pushed out of it by light. */
const neo: Theme = {
  id: 'neo',
  name: 'Neo',
  bg: '#E0E5EC',
  card: '#E0E5EC',
  cardBorder: 'rgba(255,255,255,0.85)',
  atmosphere: 'flat',
  gradientColors: ['#E0E5EC', '#E0E5EC'],
  gradientLocations: [0, 1],
  orb: null,
  text: '#4A5568',
  textSoft: 'rgba(74,85,104,0.86)',
  textMuted: 'rgba(74,85,104,0.55)',
  accent: '#6D7FA8',
  onAccent: '#FFFFFF',
  display: { fontWeight: '700', letterSpacing: -2 },
  body: { fontWeight: '400' },
  label: { fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' },
  displayScale: 0.92,
  radius: 24,
  raised: true,
  photoWash: 0.18,
  photoScrim: 'rgba(224,229,236,0.6)',
};

/** Meme: white poster, fat black caps, highlighter yellow. */
const meme: Theme = {
  id: 'meme',
  name: 'Meme',
  bg: '#FFFFFF',
  card: '#FFE800',
  cardBorder: '#000000',
  atmosphere: 'flat',
  gradientColors: ['#FFFFFF', '#FFFFFF'],
  gradientLocations: [0, 1],
  orb: null,
  text: '#000000',
  textSoft: '#000000',
  textMuted: 'rgba(0,0,0,0.6)',
  accent: '#FFE800',
  onAccent: '#000000',
  display: { fontWeight: '900', letterSpacing: -4, textTransform: 'uppercase' },
  body: { fontWeight: '700' },
  label: { fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  displayScale: 1.15,
  radius: 4,
  raised: false,
  photoWash: 0.6,
  photoScrim: 'rgba(255,255,255,0.35)',
};

export const themes: Record<ThemeId, Theme> = { field, real, neo, meme };

/** Switcher order. */
export const themeOrder: ThemeId[] = ['field', 'real', 'neo', 'meme'];

export const defaultThemeId: ThemeId = 'field';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && value in themes;
}
