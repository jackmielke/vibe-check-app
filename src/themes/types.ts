import type { TextStyle } from 'react-native';

export type ThemeId = 'field' | 'real' | 'neo' | 'meme';

/** A font choice. Omitting `fontFamily` falls back to the system face. */
export type FontSpec = {
  fontFamily?: string;
  fontWeight?: TextStyle['fontWeight'];
  fontStyle?: TextStyle['fontStyle'];
  letterSpacing?: number;
  textTransform?: TextStyle['textTransform'];
};

export type Theme = {
  id: ThemeId;
  /** Shown in the theme switcher. */
  name: string;

  // Surfaces
  bg: string;
  card: string;
  cardBorder: string;
  /** Backdrop treatment behind every screen. */
  atmosphere: 'gradient' | 'flat';
  gradientColors: readonly [string, string, ...string[]];
  gradientLocations: readonly [number, number, ...number[]];
  /** Soft moving light. `null` disables it. */
  orb: string | null;

  // Ink
  text: string;
  textSoft: string;
  textMuted: string;
  accent: string;
  /** Ink used on top of `accent`. */
  onAccent: string;

  // Type
  display: FontSpec;
  body: FontSpec;
  label: FontSpec;
  /** Multiplies the headline score size, so loud themes can shout. */
  displayScale: number;

  // Shape
  radius: number;
  /** Neumorphic themes raise surfaces instead of outlining them. */
  raised: boolean;
  /** Photo wash opacity behind the result screen. */
  photoWash: number;
  photoScrim: string;
};
