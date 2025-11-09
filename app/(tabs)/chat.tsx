// app/chat.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { colors } from '../../theme/colors'; // adjust path if yours is different
import { auth, rtdb } from '../../src/lib/firebase';
import { onValue, ref } from 'firebase/database';
import { useRouter } from 'expo-router';

type ChatItem = {
  id: string;
  name: string;
};

export default function Chat() {
  const router = useRouter();
  const uid = auth.currentUser?.uid ?? '';
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (!uid) return;
    // listen to my current active group
    const userRef = ref(rtdb, `users/${uid}/activeGroupId`);
    const unsub = onValue(userRef, (snap) => {
      const groupId = snap.val();
      if (!groupId) {
        setChats([]);
        return;
      }

      // fetch group name
      const nameRef = ref(rtdb, `groups/${groupId}/meta/name`);
      const unsubName = onValue(nameRef, (nameSnap) => {
        const name = nameSnap.val() ?? 'group';
        setChats([{ id: groupId, name }]);
      });

      // cleanup inner
      return () => unsubName();
    });
    return unsub;
  }, [uid]);

  const handleOpenChat = (groupId: string) => {
    router.push({ pathname: '/chat/[groupId]', params: { groupId } });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>chat</Text>
      <Text style={styles.sub}>your current group chats</Text>

      {chats.length === 0 ? (
        <View style={{ marginTop: 32 }}>
          <Text style={styles.empty}>no active chats.</Text>
          <Pressable onPress={() => router.push('/')} style={styles.goHomeBtn}>
            <Text style={styles.goHomeText}>go find a group</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={{ marginTop: 20 }}
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleOpenChat(item.id)} style={styles.chatRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.slice(0, 2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatSub}>random 6 · tap to open</Text>
              </View>
              <Text style={styles.openText}>open</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: { fontSize: 28, color: colors.text, fontWeight: '700' },
  sub: { color: colors.subtle ?? '#9CA3AF', marginTop: 4 },

  empty: { color: '#9CA3AF', fontSize: 14 },
  goHomeBtn: {
    marginTop: 14,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  goHomeText: { color: '#000', fontWeight: '600' },

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101113',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#13161a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  chatName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  chatSub: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  openText: { color: '#9CA3AF', fontSize: 12 },
});
