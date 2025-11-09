// src/modules/groups/votes.ts
import {
  ref,
  get,
  set,
  update,
  onValue,
  off,
  query,
  DataSnapshot,
} from 'firebase/database';
import { rtdb } from '../../lib/firebase';
import { kickMember } from './matching';
import { MAX_GROUP_SIZE } from './types';

/** Simple threshold: majority of full group (works for MAX_GROUP_SIZE=2 while testing). */
export function voteThreshold(currentMemberCount: number): number {
  // majority rounded up
  return Math.ceil(currentMemberCount / 2);
}

export type VotesMap = Record<string, Record<string, true>>; // targetUid -> { voterUid: true }
export type VoteCounts = Record<string, number>; // targetUid -> count

export function subscribeVotes(
  groupId: string,
  onChange: (raw: VotesMap, counts: VoteCounts) => void
): () => void {
  const r = ref(rtdb, `groups/${groupId}/votes`);
  const handler = (snap: DataSnapshot) => {
    const raw = (snap.val() as VotesMap) ?? {};
    const counts: VoteCounts = {};
    Object.entries(raw).forEach(([target, voters]) => {
      counts[target] = voters ? Object.keys(voters).length : 0;
    });
    onChange(raw, counts);
  };
  onValue(r, handler);
  return () => off(r);
}

/** Cast a vote. Also checks threshold and kicks if reached. */
export async function castVote(
  groupId: string,
  voterUid: string,
  targetUid: string
): Promise<void> {
  if (!groupId || !voterUid || !targetUid || voterUid === targetUid) return;

  // idempotent write (voter can only be true once)
  await set(ref(rtdb, `groups/${groupId}/votes/${targetUid}/${voterUid}`), true);

  // fetch current counts + members to evaluate kick
  const votesSnap = await get(ref(rtdb, `groups/${groupId}/votes/${targetUid}`));
  const membersSnap = await get(ref(rtdb, `groups/${groupId}/members`));
  const voters = votesSnap.exists() ? Object.keys(votesSnap.val()) : [];
  const members = membersSnap.exists() ? Object.keys(membersSnap.val()) : [];
  const count = voters.length;
  const threshold = voteThreshold(members.length || MAX_GROUP_SIZE);

  if (count >= threshold) {
    // Kick target, clear their votes node
    await kickMember(targetUid, groupId);
    await set(ref(rtdb, `groups/${groupId}/votes/${targetUid}`), null);
  }
}

/** Optional: remove your vote (not used in MVP UI). */
export async function removeVote(
  groupId: string,
  voterUid: string,
  targetUid: string
): Promise<void> {
  await set(ref(rtdb, `groups/${groupId}/votes/${targetUid}/${voterUid}`), null);
}
