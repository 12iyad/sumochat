import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';
import { auth } from '../../src/lib/firebase';
import { leaveGroup } from '../../src/modules/groups/matching';
import { useMessages } from '../../src/modules/chat/useMessages';
import { sendMessage, ChatMessage } from '../../src/modules/chat/messages';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';

export default function ChatRoom() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = useMemo(() => (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId), [params.groupId]);

  const uid = auth.currentUser?.uid ?? '';
  const { messages, loading } = useMessages(groupId, 100);
  const [text, setText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  if (!groupId) {
    return (
      <View style={styles.screen}>
        <Centered><Text style={styles.sub}>loading group…</Text></Centered>
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
      // scroll to end after a tick
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

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = item.uid === uid;
    return (
      <View style={[styles.row, mine ? styles.rowMe : styles.rowOther]}>
        <Text style={styles.msg}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>group</Text>
        <Pressable onPress={handleLeave} hitSlop={8} style={styles.leaveBtn}>
          <Ionicons name="exit-outline" size={22} color={colors.text} />
          <Text style={styles.leaveTxt}>leave</Text>
        </Pressable>
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
          onChangeText={setText}
          placeholder="message"
          placeholderTextColor="#666"
          style={styles.input}
          multiline
        />
        <Pressable onPress={handleSend} disabled={!text.trim() || sending} style={styles.sendBtn} hitSlop={8}>
          <Ionicons name="arrow-up" size={20} color={text.trim() ? colors.text : '#666'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

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
  title: { fontSize: 18, color: colors.text, fontWeight: '800', letterSpacing: 0.3 },
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
  rowMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderTopRightRadius: 4,
  },
  rowOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f0f0f',
    borderTopLeftRadius: 4,
  },
  msg: { color: colors.text, fontSize: 16, lineHeight: 20 },
  sub: { color: '#9CA3AF', marginTop: 8 },
  subCenter: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0,
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
