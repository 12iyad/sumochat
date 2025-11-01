export const MAX_GROUP_SIZE = 6;

export type City = 'london' | 'manchester' | 'birmingham'; // expand later
export type Interest = 'coding' | 'music' | 'football';     // expand later

export const makeKey = (city: string, interest: string): string =>
  `${city}_${interest}`.toLowerCase().replace(/\s+/g, '');
