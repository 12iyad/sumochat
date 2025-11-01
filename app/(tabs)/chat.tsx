import { View, Text, StyleSheet } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';

export default function Chat() {
  return (
    <View style={styles.screen}>
      <Centered>
        <Text style={styles.title}>chat</Text>
        <Text style={styles.sub}>realtime messages will appear here</Text>
      </Centered>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 32, color: colors.text, fontWeight: '700' },
  sub: { color: colors.subtle, marginTop: 8 },
});