// src/modules/chat/typing.ts
import { useEffect, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../../../src/lib/firebase';

export function useTyping(groupId?: string) {
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!groupId) return;
    const r = ref(rtdb, `groups/${groupId}/typing`);
    const unsub = onValue(r, (snap) => {
      const val = snap.val() as Record<string, { at?: number }> | null;
      if (!val) {
        setTypingMap({});
        return;
      }
      const next: Record<string, boolean> = {};
      Object.entries(val).forEach(([uid, entry]) => {
        next[uid] = true;
      });
      setTypingMap(next);
    });
    return unsub;
  }, [groupId]);
  return typingMap;
}

export async function setTyping(
  groupId: string,
  uid: string,
  isTyping: boolean
): Promise<void> {
  const node = ref(rtdb, `groups/${groupId}/typing/${uid}`);
  if (!isTyping) {
    await set(node, null);
  } else {
    await set(node, {
      at: serverTimestamp(),
    });
  }
}
