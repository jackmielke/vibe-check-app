export const colors = {
  deep: '#163A35',
  mid: '#1F4D45',
  lift: '#2A6B58',
  gold: '#C4A574',
  cream: '#F4EFE6',
  creamMuted: 'rgba(244,239,230,0.72)',
  creamSoft: 'rgba(244,239,230,0.88)',
  orb: 'rgba(255,214,160,0.55)',
};

export const gradient = {
  colors: [colors.deep, colors.mid, colors.lift, colors.gold] as const,
  locations: [0, 0.35, 0.68, 1] as const,
};
