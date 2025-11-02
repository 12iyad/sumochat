
import { useEffect, useState } from 'react';
import { ensureAnonSignIn, listenAuth } from '../../lib/firebase';
import type { User } from 'firebase/auth';

export const useAuthGate = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenAuth((u) => {
      setUser(u);
      setIsReady(true);
    });
    ensureAnonSignIn().catch((e) => {
      setErr(String(e?.message ?? e));
      setIsReady(true);
    });
    return unsub;
  }, []);

  return { user, isReady, err };
};
