
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuthGate } from './useAuthGate';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isReady, err } = useAuthGate();

  if (!isReady || !user) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator />
        <Text style={styles.txt}>signing you in…</Text>
        {err ? <Text style={styles.err}>{String(err)}</Text> : null}
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  txt: { marginTop: 10 },
  err: { color: '#ef4444', marginTop: 8, textAlign: 'center' },
});
