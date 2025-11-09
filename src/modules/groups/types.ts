export const MAX_GROUP_SIZE = 3;

export const GROUP_COLORS: readonly string[] = [
  '#FF5C8A', // neon pink
  '#FFD166', // warm yellow
  '#06D6A0', // mint green
  '#4CC9F0', // cyan
  '#B691FF', // violet
  '#FF9F1C', // orange
] as const;

export const makeKey = (city: string, interest: string): string =>
  `${city}_${interest}`.toLowerCase().replace(/\s+/g, '');
