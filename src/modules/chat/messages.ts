import {
  DataSnapshot,
  DatabaseReference,
  limitToLast,
  off,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database';
import { rtdb } from '../../lib/firebase';

export type ChatMessage = {
  id: string;
  uid: string;
  text: string;
  ts: number; // epoch ms
};

export async function sendMessage(groupId: string, uid: string, text: string): Promise<void> {
  const msgsRef = ref(rtdb, `groups/${groupId}/messages`);
  const msgRef = push(msgsRef);
  await set(msgRef, {
    uid,
    text: text.trim(),
    ts: serverTimestamp(),
  });
}

/** Subscribe to last N messages, ordered by ts ascending. Returns an unsubscribe. */
export function subscribeMessages(
  groupId: string,
  limit: number,
  onUpdate: (msgs: ChatMessage[]) => void
): () => void {
  const q = query(ref(rtdb, `groups/${groupId}/messages`), orderByChild('ts'), limitToLast(limit));
  const handler = (snap: DataSnapshot) => {
    const val = snap.val() ?? {};
    // map → array → sort by ts → add id
    const msgs: ChatMessage[] = Object.keys(val)
      .map((id) => ({
        id,
        uid: val[id]?.uid ?? '',
        text: val[id]?.text ?? '',
        ts: typeof val[id]?.ts === 'number' ? val[id].ts : 0,
      }))
      .sort((a, b) => a.ts - b.ts);
    onUpdate(msgs);
  };
  onValue(q, handler);
  return () => {
    // detach all listeners at this path
    off(q as unknown as DatabaseReference);
  };
}
