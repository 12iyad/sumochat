import { useEffect, useState } from 'react';
import { ensureAnonSignIn, listenAuth } from '../../lib/firebase';
import type { User } from 'firebase/auth';

export const useAuthGate = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const unsub = listenAuth((u) => {
      setUser(u);
      setIsReady(true);
    });
    // kick anonymous sign-in
    ensureAnonSignIn().catch(() => setIsReady(true));
    return unsub;
  }, []);

  return { user, isReady };
};
