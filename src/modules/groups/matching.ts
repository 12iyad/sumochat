import { ref, get, push, set, update, child, serverTimestamp } from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import { MAX_GROUP_SIZE, makeKey } from './types';

/**
 * Adds the user to a waiting pool; if pool already has (MAX_GROUP_SIZE - 1) users,
 * converts them into a new group and returns the groupId.
 * Otherwise returns a special string "waiting:<key>" so the UI can poll/listen.
 */
export async function findOrCreateGroup(
  uid: string,
  city: string,
  interest: string
): Promise<string> {
  const key = makeKey(city, interest);
  const waitingRef = ref(rtdb, `waiting/${key}`);
  const snap = await get(waitingRef);
  const waitingUids: string[] = snap.exists() ? Object.keys(snap.val()) : [];

  // if we already have enough waiting users, create a group with them + me
  if (waitingUids.length >= MAX_GROUP_SIZE - 1) {
    const groupRef = push(ref(rtdb, 'groups'));
    const groupId = groupRef.key!;
    const members = [...waitingUids.slice(0, MAX_GROUP_SIZE - 1), uid];

    const updates: Record<string, unknown> = {};
    // set members
    members.forEach((m) => {
      updates[`groups/${groupId}/members/${m}`] = true;
      updates[`users/${m}/activeGroupId`] = groupId;
      // remove from waiting
      updates[`waiting/${key}/${m}`] = null;
    });
    // meta
    updates[`groups/${groupId}/meta`] = {
      city_interest_key: key,
      createdAt: serverTimestamp(),
    };

    await update(ref(rtdb), updates);
    return groupId;
  }

  // else: add me to waiting pool and return a "waiting" token
  await set(child(waitingRef, uid), true);
  // clear any stale activeGroupId
  await set(ref(rtdb, `users/${uid}/activeGroupId`), null);
  return `waiting:${key}`;
}
