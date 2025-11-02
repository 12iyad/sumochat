import { useEffect, useState } from 'react';
import { ChatMessage, subscribeMessages } from './messages';

export function useMessages(groupId: string | undefined, limit: number = 100) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const unsub = subscribeMessages(groupId, limit, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [groupId, limit]);

  return { messages, loading };
}
