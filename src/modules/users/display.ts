// src/modules/users/display.ts

function djb2Hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return Math.abs(h);
}

function hslToHex(h: number, s: number, l: number): string {
  // h 0..360, s/l 0..100
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const v = Math.round(255 * x);
    const hex = v.toString(16).padStart(2, '0');
    return hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/** Neon-ish hex on dark, stable per uid */
export function colorFromUid(uid: string): string {
  if (!uid) return '#888888';
  const h = djb2Hash(uid) % 360; // 0..359
  const s = 90;                  // saturated (neon)
  const l = 55;                  // bright
  return hslToHex(h, s, l);
}

/** Simple anon label for now */
export function displayFromUid(uid: string, meUid?: string): string {
  if (!uid) return 'anon';
  if (meUid && uid === meUid) return 'you';
  return `anon-${uid.slice(-4)}`;
}
