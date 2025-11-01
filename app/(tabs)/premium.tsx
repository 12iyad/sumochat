import { View, Text, StyleSheet } from 'react-native';
import Centered from '../../components/Centered';
import { colors } from '../../theme/colors';

export default function Premium() {
  return (
    <View style={styles.screen}>
      <Centered>
        <Text style={styles.title}>premium</Text>
        <Text style={styles.sub}>placeholder for future perks</Text>
      </Centered>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  title: { fontSize: 32, color: colors.text, fontWeight: '700' },
  sub: { color: colors.subtle, marginTop: 8 },
});
