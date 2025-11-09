import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';
import { auth, rtdb } from '../../src/lib/firebase';
import { leaveGroup } from '../../src/modules/groups/matching';
import { useMessages } from '../../src/modules/chat/useMessages';
import { sendMessage, ChatMessage } from '../../src/modules/chat/messages';
import { Ionicons } from '@expo/vector-icons';
import { useGroupColors } from '../../src/modules/groups/useGroupColors';
import { displayFromUid } from '../../src/modules/users/display';
import { onValue, ref } from 'firebase/database';
import { useTyping, setTyping } from '../../src/modules/chat/typing';

const MAX_SLOTS = 6;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 16, color: colors.text, fontWeight: '700', letterSpacing: 0.2 },
  dotsRow: { flexDirection: 'row', gap: 6 },

  dotWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBig: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  leaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.9 },
  leaveTxt: { color: colors.text, fontSize: 12, opacity: 0.8 },

  listContent: { paddingHorizontal: 12, paddingBottom: 8 },
  row: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 6,
  },
  rowMe: { alignSelf: 'flex-end', backgroundColor: '#1a1a1a', borderTopRightRadius: 4 },
  rowOther: { alignSelf: 'flex-start', backgroundColor: '#0f0f0f', borderTopLeftRadius: 4 },

  rowMineWrap: { alignSelf: 'flex-end', marginVertical: 6, paddingRight: 4 },
  nameLineMine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  rowOtherWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 6,
    paddingLeft: 4,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, marginTop: 2 },

  msg: { color: colors.text, fontSize: 16, lineHeight: 20 },
  nameOther: { color: '#9CA3AF', fontSize: 12, marginLeft: 4, marginBottom: 4 },
  nameMine: { color: '#9CA3AF', fontSize: 12 },

  sub: { color: '#9CA3AF', marginTop: 8 },
  subCenter: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },

  dot: { width: 8, height: 8, borderRadius: 4 },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0d0d0d',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    color: colors.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#141414',
    borderRadius: 12,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
});

export default function ChatRoom() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = useMemo(
    () => (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId),
    [params.groupId]
  );
  const uid = auth.currentUser?.uid ?? '';
  const { messages, loading } = useMessages(groupId, 100);
  const colorsMap = useGroupColors(groupId);
  const typingMap = useTyping(groupId);
  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('group');
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // watch group name
  useEffect(() => {
    if (!groupId) return;
    const metaRef = ref(rtdb, `groups/${groupId}/meta/name`);
    const unsub = onValue(metaRef, (snap) => {
      const val = snap.val();
      setGroupName(typeof val === 'string' && val.length > 0 ? val : 'group');
    });
    return unsub;
  }, [groupId]);

  // watch my membership
  useEffect(() => {
    if (!uid) return;
    const userRef = ref(rtdb, `users/${uid}/activeGroupId`);
    const unsub = onValue(userRef, (snap) => {
      const val = snap.val();
      if (!val || (groupId && val !== groupId)) {
        setTimeout(() => {
          Alert.alert('you were removed', 'you are no longer in this group.');
          router.replace('/');
        }, 200);
      }
    });
    return unsub;
  }, [uid, groupId, router]);

  if (!groupId) {
    return (
      <View style={styles.screen}>
        <Centered>
          <Text style={styles.sub}>loading group…</Text>
        </Centered>
      </View>
    );
  }

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !uid || sending) return;
    setSending(true);
    try {
      await sendMessage(groupId, uid, trimmed);
      setText('');
      setTyping(groupId, uid, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } finally {
      setSending(false);
    }
  };

  const handleLeave = async () => {
    if (!uid) return;
    await leaveGroup(uid, groupId);
    router.replace('/');
  };

  const handleChangeText = (value: string) => {
    setText(value);
    if (!groupId || !uid) return;
    setTyping(groupId, uid, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(groupId, uid, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.uid === uid;
    const name = displayFromUid(item.uid, uid);
    const color = colorsMap[item.uid] ?? '#888';

    if (mine) {
      return (
        <View style={styles.rowMineWrap}>
          <View style={styles.nameLineMine}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={styles.nameMine}>{name}</Text>
          </View>
          <View style={[styles.row, styles.rowMe]}>
            <Text style={styles.msg}>{item.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.rowOtherWrap}>
        <View style={[styles.avatar, { backgroundColor: color }]} />
        <View style={{ maxWidth: '80%' }}>
          <Text style={styles.nameOther}>{name}</Text>
          <View style={[styles.row, styles.rowOther]}>
            <Text style={styles.msg}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  };

  // 6 dot slots
  const memberEntries = Object.entries(colorsMap);
  const headerSlots = Array.from({ length: MAX_SLOTS }).map((_, idx) => {
    const entry = memberEntries[idx];
    if (!entry) {
      return { color: '#333', typing: false };
    }
    const [memberUid, c] = entry;
    return {
      color: c,
      typing: !!typingMap[memberUid],
    };
  });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {/* back to chat list */}
        <Pressable onPress={() => router.push('/chat')} hitSlop={8} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>{groupName}</Text>
          <View style={styles.dotsRow}>
            {headerSlots.map((slot, idx) => (
              <View
                key={idx}
                style={[
                  styles.dotWrap,
                  slot.typing && { borderWidth: 1.5, borderColor: '#00ff80' },
                ]}
              >
                <View style={[styles.dotBig, { backgroundColor: slot.color }]} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push(`/chat/${groupId}/info`)}
            hitSlop={8}
            style={{ padding: 2 }}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable onPress={handleLeave} hitSlop={8} style={styles.leaveBtn}>
            <Ionicons name="exit-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={!loading ? <Text style={styles.subCenter}>no messages yet</Text> : null}
      />

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={handleChangeText}
          placeholder="message"
          placeholderTextColor="#666"
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={styles.sendBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-up" size={20} color={text.trim() ? colors.text : '#666'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
