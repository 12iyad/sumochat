import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../../lib/firebase';

export function useGroupColors(groupId?: string) {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!groupId) return;
    const r = ref(rtdb, `groups/${groupId}/colors`);
    const off = onValue(r, (snap) => setMap((snap.val() as Record<string, string>) ?? {}));
    return off;
  }, [groupId]);
  return map;
}
