import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { auth, rtdb } from '../../lib/firebase';

export const useActiveGroupId = () => {
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const userRef = ref(rtdb, `users/${uid}/activeGroupId`);
    const unsub = onValue(userRef, (snap) => {
      const val = snap.val();
      setGroupId(typeof val === 'string' && val.length > 0 ? val : null);
    });
    return unsub;
  }, [auth.currentUser?.uid]);

  return groupId;
};