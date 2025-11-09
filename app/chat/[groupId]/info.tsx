import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '../../../src/lib/firebase';
import { colors as theme } from '../../../theme/colors';
import { displayFromUid } from '../../../src/modules/users/display';
import { GROUP_COLORS } from '../../../src/modules/groups/types';
import { subscribeVotes, castVote, VoteCounts } from '../../../src/modules/groups/votes';
import { auth } from '../../../src/lib/firebase';

type SlotItem = {
  index: number;
  color: string;
  uid: string | null; // null = free
};

type MemberItem = {
  uid: string;
  color: string;
  votes: number;
  votedByMe: boolean;
};

export default function GroupInfo() {
  const router = useRouter();
  const meUid = auth.currentUser?.uid ?? '';
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const groupId = useMemo(
    () => (Array.isArray(params.groupId) ? params.groupId[0] : params.groupId),
    [params.groupId]
  );

  const [slots, setSlots] = useState<SlotItem[]>(
    GROUP_COLORS.map((c, i) => ({ index: i, color: c, uid: null }))
  );
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [votedByMe, setVotedByMe] = useState<Record<string, boolean>>({}); // targetUid -> true

  // palette + colors → slots
  useEffect(() => {
    if (!groupId) return;

    const unsubPalette = onValue(ref(rtdb, `groups/${groupId}/meta/palette`), (snap) => {
      const palette: string[] = snap.exists()
        ? (Object.values(snap.val()) as string[])
        : GROUP_COLORS.slice();
      setSlots((prev) =>
        palette.map((c, i) => {
          const found = prev.find((p) => p.index === i);
          return { index: i, color: c, uid: found?.uid ?? null };
        })
      );
    });

    const unsubColors = onValue(ref(rtdb, `groups/${groupId}/colors`), (snap) => {
      const byUid: Record<string, string> = snap.exists() ? (snap.val() as Record<string, string>) : {};
      const inverted = new Map<string, string>();
      Object.entries(byUid).forEach(([uid, col]) => inverted.set(col, uid));
      setSlots((prev) => prev.map((s) => ({ ...s, uid: inverted.get(s.color) ?? null })));
    });

    return () => {
      unsubPalette();
      unsubColors();
    };
  }, [groupId]);

  // members list from slots (only occupied)
  useEffect(() => {
    const m = slots
      .filter((s) => s.uid)
      .map((s) => ({
        uid: s.uid as string,
        color: s.color,
        votes: voteCounts[s.uid as string] ?? 0,
        votedByMe: !!votedByMe[s.uid as string],
      }));
    setMembers(m);
  }, [slots, voteCounts, votedByMe]);

  // votes subscription → counts + whether I voted
  useEffect(() => {
    if (!groupId || !meUid) return;
    const unsub = subscribeVotes(groupId, (raw, counts) => {
      setVoteCounts(counts);
      const meMap: Record<string, boolean> = {};
      Object.entries(raw).forEach(([target, voters]) => {
        meMap[target] = !!voters?.[meUid];
      });
      setVotedByMe(meMap);
    });
    return unsub;
  }, [groupId, meUid]);

  if (!groupId) {
    return (
      <View style={styles.screen}>
        <Text style={styles.sub}>no group</Text>
      </View>
    );
  }

  const renderSlot = ({ item }: { item: SlotItem }) => {
    const occupied = !!item.uid;
    return (
      <View style={styles.card}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.slotTitle}>slot {item.index + 1}</Text>
          <Text style={[styles.state, occupied ? styles.occ : styles.free]}>
            {occupied ? `occupied by ${displayFromUid(item.uid!)}` : 'free'}
          </Text>
        </View>
      </View>
    );
  };

  const renderMember = ({ item }: { item: MemberItem }) => {
    const isMe = item.uid === meUid;
    const canVote = !isMe && !item.votedByMe;
    return (
      <View style={styles.memberRow}>
        <View style={[styles.memberDot, { backgroundColor: item.color }]} />
        <Text style={styles.memberName}>{displayFromUid(item.uid, meUid)}</Text>
        <View style={styles.spacer} />
        <Text style={styles.voteCount}>{item.votes}</Text>
        <Pressable
          onPress={() => castVote(groupId, meUid, item.uid)}
          disabled={!canVote}
          style={[styles.voteBtn, !canVote && styles.voteBtnDisabled]}
          hitSlop={8}
        >
          <Text style={styles.voteTxt}>{isMe ? 'you' : item.votedByMe ? 'voted' : 'vote'}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
          <Text style={styles.back}>← back</Text>
        </Pressable>
        <Text style={styles.title}>group info</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.sectionTitle}>members</Text>
      <FlatList
        data={members}
        keyExtractor={(m) => m.uid}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
      />

      <Text style={styles.sectionTitle}>color slots</Text>
      <FlatList
        data={slots}
        keyExtractor={(s) => `slot-${s.index}`}
        renderItem={renderSlot}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: theme.text, fontSize: 14, opacity: 0.9 },
  title: { fontSize: 18, color: theme.text, fontWeight: '800', letterSpacing: 0.3 },

  sectionTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.9,
    paddingHorizontal: 16,
    marginTop: 8,
  },

  list: { paddingHorizontal: 12, paddingBottom: 12, paddingTop: 6 },

  // members
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
  },
  memberDot: { width: 16, height: 16, borderRadius: 8 },
  memberName: { color: theme.text, fontSize: 14, fontWeight: '700' },
  spacer: { flex: 1 },
  voteCount: { color: '#9CA3AF', marginRight: 10 },

  voteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#141414',
  },
  voteBtnDisabled: { opacity: 0.5 },
  voteTxt: { color: theme.text, fontSize: 12, fontWeight: '700' },

  // slots
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
    marginVertical: 6,
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  slotTitle: { color: theme.text, fontSize: 14, fontWeight: '700' },
  state: { marginTop: 2, fontSize: 12 },
  occ: { color: '#9CA3AF' },
  free: { color: '#6B7280' },
  sub: { color: '#9CA3AF', textAlign: 'center', marginTop: 24 },
});
