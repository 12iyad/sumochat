export const MAX_GROUP_SIZE = 2;

export const makeKey = (city: string, interest: string): string =>
  `${city}_${interest}`.toLowerCase().replace(/\s+/g, '');
