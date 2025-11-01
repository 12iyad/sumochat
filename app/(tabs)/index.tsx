import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';
import { auth } from '../../src/lib/firebase';
import { findOrCreateGroup } from '../../src/modules/groups/matching';

export default function Discover() {
  const uid = auth.currentUser?.uid ?? 'unknown';

  const handleFindGroup = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await findOrCreateGroup(uid, 'london', 'coding');
      if (res.startsWith('waiting:')) {
        Alert.alert('Queued', 'we added you to a waiting pool — we’ll move you into a group soon.');
      } else {
        Alert.alert('Matched', `you joined a group: ${res}`);
      }
    } catch (e: any) {
      Alert.alert('Error', String(e?.message ?? e));
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
        <Button title="Find Group" onPress={handleFindGroup} />
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
