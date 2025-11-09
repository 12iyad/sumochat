import {
  ref,
  get,
  set,
  update,
  push,
  child,
  serverTimestamp,
  query,
  limitToFirst,
  remove,
} from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import { MAX_GROUP_SIZE, makeKey, GROUP_COLORS } from './types';

/* -------------------- helpers -------------------- */
function generateGroupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function getMembersCount(groupId: string): Promise<number> {
  const snap = await get(ref(rtdb, `groups/${groupId}/members`));
  return snap.exists() ? Object.keys(snap.val()).length : 0;
}

async function ensureOpenIndex(key: string, groupId: string, isOpen: boolean): Promise<void> {
  await set(ref(rtdb, `open_groups/${key}/${groupId}`), isOpen ? true : null);
}

async function assignColorSlot(groupId: string, uid: string): Promise<void> {
  const paletteRef = ref(rtdb, `groups/${groupId}/meta/palette`);
  const availRef = ref(rtdb, `groups/${groupId}/meta/available`);
  const palSnap = await get(paletteRef);
  if (!palSnap.exists()) {
    const init: Record<string, unknown> = {};
    GROUP_COLORS.forEach((c, i) => {
      init[`groups/${groupId}/meta/palette/${i}`] = c;
      init[`groups/${groupId}/meta/available/${i}`] = true;
    });
    await update(ref(rtdb), init);
  }

  const availSnap = await get(availRef);
  let idx: number | null = null;
  if (availSnap.exists()) {
    const map = availSnap.val() as Record<string, true>;
    const keys = Object.keys(map);
    if (keys.length > 0) idx = Number(keys.sort()[0]);
  }
  if (idx === null || Number.isNaN(idx)) idx = 0;

  const color = GROUP_COLORS[idx] ?? GROUP_COLORS[0];
  const updates: Record<string, unknown> = {};
  updates[`groups/${groupId}/colors/${uid}`] = color;
  updates[`groups/${groupId}/meta/available/${idx}`] = null;
  await update(ref(rtdb), updates);
}

async function releaseColorSlot(groupId: string, uid: string): Promise<void> {
  const palSnap = await get(ref(rtdb, `groups/${groupId}/meta/palette`));
  const colSnap = await get(ref(rtdb, `groups/${groupId}/colors/${uid}`));
  if (!palSnap.exists() || !colSnap.exists()) {
    await set(ref(rtdb, `groups/${groupId}/colors/${uid}`), null);
    return;
  }
  const palette: string[] = Object.values(palSnap.val());
  const color: string = colSnap.val();
  const idx = palette.findIndex((c) => c === color);
  const updates: Record<string, unknown> = {};
  updates[`groups/${groupId}/colors/${uid}`] = null;
  if (idx >= 0) updates[`groups/${groupId}/meta/available/${idx}`] = true;
  await update(ref(rtdb), updates);
}

/** fully remove a group that has no members */
async function deleteGroup(groupId: string, key?: string | null): Promise<void> {
  // remove group tree
  await remove(ref(rtdb, `groups/${groupId}`));
  // remove from open index if we know the key
  if (key) {
    await set(ref(rtdb, `open_groups/${key}/${groupId}`), null);
  }
}

/* -------------------- public API -------------------- */
export async function findOrCreateGroup(
  uid: string,
  city: string,
  interest: string
): Promise<string> {
  const key = makeKey(city, interest);

  // already in group → return
  const current = await get(ref(rtdb, `users/${uid}/activeGroupId`));
  const currVal = current.val();
  if (typeof currVal === 'string' && currVal.length > 0) return currVal;

  // 1) try existing open group first (to grow up to 6)
  const openSnap = await get(query(ref(rtdb, `open_groups/${key}`), limitToFirst(1)));
  if (openSnap.exists()) {
    const groupId: string = Object.keys(openSnap.val())[0];
    await update(ref(rtdb), {
      [`groups/${groupId}/members/${uid}`]: true,
      [`users/${uid}/activeGroupId`]: groupId,
    });
    await assignColorSlot(groupId, uid);
    const count = await getMembersCount(groupId);
    await ensureOpenIndex(key, groupId, count < MAX_GROUP_SIZE);
    return groupId;
  }

  // 2) check waiting
  const waitingRef = ref(rtdb, `waiting/${key}`);
  const wSnap = await get(waitingRef);
  const allWaiting: string[] = wSnap.exists() ? Object.keys(wSnap.val()) : [];
  const otherWaiting = allWaiting.filter((x) => x !== uid);

  // create at 2 (me + someone else), keep open to 6
  if (otherWaiting.length >= 1) {
    const groupRef = push(ref(rtdb, 'groups'));
    const groupId = groupRef.key!;
    const groupName = generateGroupCode();

    const firstOther = otherWaiting[0];
    const members = [firstOther, uid];

    const updates: Record<string, unknown> = {};

    members.forEach((m) => {
      updates[`groups/${groupId}/members/${m}`] = true;
      updates[`users/${m}/activeGroupId`] = groupId;
      updates[`waiting/${key}/${m}`] = null;
    });

    GROUP_COLORS.forEach((c, i) => {
      updates[`groups/${groupId}/meta/palette/${i}`] = c;
      updates[`groups/${groupId}/meta/available/${i}`] = true;
    });
    updates[`groups/${groupId}/meta/city_interest_key`] = key;
    updates[`groups/${groupId}/meta/createdAt`] = serverTimestamp();
    updates[`groups/${groupId}/meta/name`] = groupName;

    members.forEach((m, i) => {
      const color = GROUP_COLORS[i] ?? GROUP_COLORS[0];
      updates[`groups/${groupId}/colors/${m}`] = color;
      updates[`groups/${groupId}/meta/available/${i}`] = null;
    });

    await update(ref(rtdb), updates);
    // not full → index as open
    await ensureOpenIndex(key, groupId, true);
    return groupId;
  }

  // 3) nobody waiting → just queue me
  await set(child(waitingRef, uid), true);
  await set(ref(rtdb, `users/${uid}/activeGroupId`), null);
  return `waiting:${key}`;
}

export async function leaveGroup(uid: string, groupId: string): Promise<void> {
  // get key first so we can clean indices if empty
  const metaSnap = await get(ref(rtdb, `groups/${groupId}/meta/city_interest_key`));
  const key: string | null = metaSnap.exists() ? metaSnap.val() : null;

  // remove user
  const updates: Record<string, unknown> = {};
  updates[`groups/${groupId}/members/${uid}`] = null;
  updates[`users/${uid}/activeGroupId`] = null;
  await update(ref(rtdb), updates);
  await releaseColorSlot(groupId, uid);

  // check remaining members
  const remaining = await getMembersCount(groupId);
  if (remaining === 0) {
    await deleteGroup(groupId, key);
    return;
  }

  if (!key) return;

  // try backfill
  const nextSnap = await get(query(ref(rtdb, `waiting/${key}`), limitToFirst(1)));
  if (nextSnap.exists()) {
    const nextUid: string = Object.keys(nextSnap.val())[0];
    const up: Record<string, unknown> = {};
    up[`waiting/${key}/${nextUid}`] = null;
    up[`groups/${groupId}/members/${nextUid}`] = true;
    up[`users/${nextUid}/activeGroupId`] = groupId;
    await update(ref(rtdb), up);
    await assignColorSlot(groupId, nextUid);

    const count = await getMembersCount(groupId);
    await ensureOpenIndex(key, groupId, count < MAX_GROUP_SIZE);
    return;
  }

  // keep open if still not full
  await ensureOpenIndex(key, groupId, true);
}

export async function kickMember(targetUid: string, groupId: string): Promise<void> {
  const metaSnap = await get(ref(rtdb, `groups/${groupId}/meta/city_interest_key`));
  const key: string | null = metaSnap.exists() ? metaSnap.val() : null;

  const updates: Record<string, unknown> = {};
  updates[`groups/${groupId}/members/${targetUid}`] = null;
  updates[`users/${targetUid}/activeGroupId`] = null;
  await update(ref(rtdb), updates);
  await releaseColorSlot(groupId, targetUid);

  // check remaining members
  const remaining = await getMembersCount(groupId);
  if (remaining === 0) {
    await deleteGroup(groupId, key);
    return;
  }

  if (!key) return;

  const nextSnap = await get(query(ref(rtdb, `waiting/${key}`), limitToFirst(1)));
  if (nextSnap.exists()) {
    const nextUid: string = Object.keys(nextSnap.val())[0];
    const up: Record<string, unknown> = {};
    up[`waiting/${key}/${nextUid}`] = null;
    up[`groups/${groupId}/members/${nextUid}`] = true;
    up[`users/${nextUid}/activeGroupId`] = groupId;
    await update(ref(rtdb), up);
    await assignColorSlot(groupId, nextUid);

    const count = await getMembersCount(groupId);
    await ensureOpenIndex(key, groupId, count < MAX_GROUP_SIZE);
    return;
  }

  await ensureOpenIndex(key, groupId, true);
}
