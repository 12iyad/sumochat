import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = { children: React.ReactNode; maxWidth?: number };
export default function Centered({ children, maxWidth = 480 }: Props) {
  return <View style={[styles.root, { maxWidth }]}>{children}</View>;
}
const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
});