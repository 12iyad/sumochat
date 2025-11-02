import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';
import { auth } from '../../src/lib/firebase';
import { findOrCreateGroup } from '../../src/modules/groups/matching';
import { useActiveGroupId } from '../../src/modules/groups/useActiveGroup';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Discover() {
  const uid = auth.currentUser?.uid ?? 'unknown';
  const router = useRouter();
  const activeGroupId = useActiveGroupId();
  const [isFinding, setIsFinding] = useState<boolean>(false);

  useEffect(() => {
    if (activeGroupId) {
      router.replace({ pathname: '/chat/[groupId]', params: { groupId: activeGroupId } });
    }
  }, [activeGroupId, router]);

  const handleFindGroup = async () => {
    if (!auth.currentUser || isFinding) return; // 👈 prevent double-tap
    setIsFinding(true);
    try {
      const res = await findOrCreateGroup(uid, 'london', 'coding');

      if (res.startsWith('waiting:')) {
        Alert.alert('queued', 'you’re in the waiting pool — we’ll move you into a group soon.');
      } else {
        router.replace({ pathname: '/chat/[groupId]', params: { groupId: res } });
      }
    } catch (e: any) {
      Alert.alert('error', String(e?.message ?? e));
    } finally {
      setIsFinding(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Centered>
        <Text style={styles.title}>sumo</Text>
        <Text style={styles.sub}>random group chat • 6 ppl • vote to kick</Text>
        <View style={{ height: 16 }} />
        <Text style={styles.uid}>uid: {uid}</Text>
        <View style={{ height: 24 }} />
        <Button
          title={isFinding ? 'Finding…' : 'Find Group'}
          onPress={handleFindGroup}
          disabled={isFinding}
        />
      </Centered>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 40, color: colors.text, fontWeight: '800' },
  sub: { color: '#9CA3AF', marginTop: 8 },
  uid: { color: colors.text, marginTop: 8, opacity: 0.7 },
});
