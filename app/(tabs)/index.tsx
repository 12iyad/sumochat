import { View, Text, Button, StyleSheet } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';
import { Link } from 'expo-router';

export default function Discover() {
  return (
    <View style={styles.screen}>
      <Centered>
        <Text style={styles.title}>sumo</Text>
        <Text style={styles.sub}>random group chat • 6 ppl • vote to kick</Text>
        <View style={{ height: 24 }} />
        <Button title="Find Group" onPress={() => { /* will trigger matching later */ }} />
        <View style={{ height: 24 }} />
        <Link href="/trending"><Text style={styles.link}>see trending words →</Text></Link>
      </Centered>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 40, color: colors.text, fontWeight: '800' },
  sub: { color: colors.subtle, marginTop: 8 },
  link: { color: colors.tint, marginTop: 8, fontSize: 16 },
});
