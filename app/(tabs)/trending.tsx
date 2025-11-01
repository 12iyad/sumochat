import { View, Text, StyleSheet } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';

export default function Trending() {
  return (
    <View style={styles.screen}>
      <Centered>
        <Text style={styles.title}>trending</Text>
        <Text style={styles.sub}>top words from group chats (daily)</Text>
      </Centered>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 32, color: colors.text, fontWeight: '700' },
  sub: { color: colors.subtle, marginTop: 8 },
});