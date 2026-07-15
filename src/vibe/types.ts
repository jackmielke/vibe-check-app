export type FactorLabel =
  | 'Lighting'
  | 'Smile'
  | 'Energy'
  | 'Framing'
  | 'Charisma';

export type VibeFactor = {
  label: FactorLabel;
  value: number; // 0..1
};

export type VibeResult = {
  score: number; // 0..100
  analysis: string;
  factors: VibeFactor[];
};
