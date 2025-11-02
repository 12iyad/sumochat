import {
  ref, get, set, update, push, child, serverTimestamp, query, limitToFirst
} from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import { MAX_GROUP_SIZE, makeKey } from './types';

async function getMembersCount(groupId: string): Promise<number> {
  const snap = await get(ref(rtdb, `groups/${groupId}/members`));
  return snap.exists() ? Object.keys(snap.val()).length : 0;
}

async function addUserToGroup(groupId: string, uid: string): Promise<void> {
  await update(ref(rtdb), {
    [`groups/${groupId}/members/${uid}`]: true,
    [`users/${uid}/activeGroupId`]: groupId,
  });
}

async function ensureOpenIndex(key: string, groupId: string, isOpen: boolean): Promise<void> {
  await set(ref(rtdb, `open_groups/${key}/${groupId}`), isOpen ? true : null);
}

export async function findOrCreateGroup(
  uid: string,
  city: string,
  interest: string
): Promise<string> {
  const key = makeKey(city, interest);

  // 0) if already in a group, return it
  const current = await get(ref(rtdb, `users/${uid}/activeGroupId`));
  const currVal = current.val();
  if (typeof currVal === 'string' && currVal.length > 0) {
    return currVal;
  }

  // 1) try to join an existing open group first
  const openSnap = await get(query(ref(rtdb, `open_groups/${key}`), limitToFirst(1)));
  if (openSnap.exists()) {
    const groupId: string = Object.keys(openSnap.val())[0];
    await addUserToGroup(groupId, uid);
    const count = await getMembersCount(groupId);
    if (count >= MAX_GROUP_SIZE) await ensureOpenIndex(key, groupId, false);
    return groupId;
  }

  // 2) check waiting, excluding me if I'm already there
  const waitingRef = ref(rtdb, `waiting/${key}`);
  const wSnap = await get(waitingRef);
  const allWaiting: string[] = wSnap.exists() ? Object.keys(wSnap.val()) : [];
  const waitingUids = allWaiting.filter((x) => x !== uid);

  if (waitingUids.length >= MAX_GROUP_SIZE - 1) {
    const groupRef = push(ref(rtdb, 'groups'));
    const groupId = groupRef.key!;

    // dedupe: exclude me from slice then append me; Set removes any accidental dupes
    const members = Array.from(new Set([...waitingUids.slice(0, MAX_GROUP_SIZE - 1), uid]));

    const updates: Record<string, unknown> = {};
    members.forEach((m) => {
      updates[`groups/${groupId}/members/${m}`] = true;
      updates[`users/${m}/activeGroupId`] = groupId;
      updates[`waiting/${key}/${m}`] = null; // safe even if m wasn't in waiting
    });
    updates[`groups/${groupId}/meta`] = {
      city_interest_key: key,
      createdAt: serverTimestamp(),
    };

    await update(ref(rtdb), updates);
    return groupId;
  }

  // 3) otherwise put me into waiting (idempotent)
  await set(ref(rtdb, `waiting/${key}/${uid}`), true);
  await set(ref(rtdb, `users/${uid}/activeGroupId`), null);
  return `waiting:${key}`;
}


// --- leaveGroup (restored) ---
export async function leaveGroup(uid: string, groupId: string): Promise<void> {
  const metaSnap = await get(ref(rtdb, `groups/${groupId}/meta/city_interest_key`));
  const key: string | null = metaSnap.exists() ? metaSnap.val() : null;

  // always clear the user's membership + activeGroupId
  const updates: Record<string, unknown> = {};
  updates[`groups/${groupId}/members/${uid}`] = null;
  updates[`users/${uid}/activeGroupId`] = null;
  await update(ref(rtdb), updates);

  if (!key) return; // no metadata → done

  // try to pull someone from waiting to fill the spot
  const nextSnap = await get(query(ref(rtdb, `waiting/${key}`), limitToFirst(1)));
  if (nextSnap.exists()) {
    const nextUid: string = Object.keys(nextSnap.val())[0];
    const newUpdates: Record<string, unknown> = {};
    newUpdates[`waiting/${key}/${nextUid}`] = null;
    newUpdates[`groups/${groupId}/members/${nextUid}`] = true;
    newUpdates[`users/${nextUid}/activeGroupId`] = groupId;
    await update(ref(rtdb), newUpdates);

    const memberCount = await get(ref(rtdb, `groups/${groupId}/members`));
    const count = memberCount.exists() ? Object.keys(memberCount.val()).length : 0;
    if (count < MAX_GROUP_SIZE) {
      await set(ref(rtdb, `open_groups/${key}/${groupId}`), true);
    } else {
      await set(ref(rtdb, `open_groups/${key}/${groupId}`), null);
    }
    return;
  }

  // nobody waiting → keep group open for next joiners
  await set(ref(rtdb, `open_groups/${key}/${groupId}`), true);
}
