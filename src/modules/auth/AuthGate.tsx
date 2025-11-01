import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuthGate } from './useAuthGate';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuthGate();

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator />
        <Text style={styles.txt}>signing you in…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  txt: { marginTop: 10 },
});
