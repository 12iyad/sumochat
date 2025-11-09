// index.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

type Mode = {
  id: string;
  title: string;
  colors: [string, string];
};

const MODES: Mode[] = [
  { id: 'calm', title: 'Calm', colors: ['#0f172a', '#1f2937'] },
  { id: 'sleep', title: 'Sleep', colors: ['#020617', '#0f172a'] },
  { id: 'gratitude', title: 'Gratitude', colors: ['#f97316', '#fb7185'] },
  { id: 'success', title: 'Success', colors: ['#0f766e', '#0f172a'] },
  { id: 'healing', title: 'Healing', colors: ['#7c3aed', '#0f172a'] },
];

export default function App() {
  const [currentMode, setCurrentMode] = useState<Mode>(MODES[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const toggleDrawer = () => {
    const toValue = drawerOpen ? 0 : 1;
    setDrawerOpen(!drawerOpen);
    Animated.timing(drawerAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const translateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  return (
    <LinearGradient
      colors={currentMode.colors}
      style={styles.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.burger}>
            <View style={styles.line} />
            <View style={styles.line} />
            <View style={styles.line} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{currentMode.title}</Text>
          {/* spacer to balance flex */}
          <View style={{ width: 40 }} />
        </View>

        {/* main calm/sleep/etc UI */}
        <View style={styles.center}>
          <Text style={styles.greeting}>breathe in,</Text>
          <Text style={styles.mainTitle}>{currentMode.title} session</Text>
          <Text style={styles.subtitle}>15 min · ai voice · ocean waves</Text>

          <View style={styles.player}>
            <TouchableOpacity style={styles.playBtn}>
              <Text style={styles.playText}>▶</Text>
            </TouchableOpacity>
            <Text style={styles.timer}>15:00</Text>
            <View style={styles.row}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>affirmations: normal</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>binaural: 4.5 Hz</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardOfDay}>
            <Text style={styles.cardTitle}>affirmation card of the day</Text>
            <Text style={styles.cardText}>
              “you are allowed to rest today.”
            </Text>
          </View>
        </View>

        {/* stacked drawer / file-cabinet selector */}
        <Animated.View
          pointerEvents={drawerOpen ? 'auto' : 'none'}
          style={[
            styles.drawerOverlay,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.drawerHandle} />
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          >
            {MODES.map((mode, index) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => {
                  setCurrentMode(mode);
                  toggleDrawer();
                }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={mode.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.modeCard,
                    { top: index * -10 }, // slight stacked effect
                  ]}
                >
                  <Text style={styles.modeTitle}>{mode.title}</Text>
                  <Text style={styles.modeSub}>tap to enter</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 18 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  burger: {
    width: 40,
    height: 34,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  line: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
  },
  topTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  center: {
    flex: 1,
    marginTop: 18,
  },
  greeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 6,
  },
  player: {
    backgroundColor: 'rgba(2,6,23,0.25)',
    borderRadius: 24,
    padding: 18,
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  playBtn: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: 'rgba(248,250,252,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  playText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  timer: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  chip: {
    backgroundColor: 'rgba(15,23,42,0.25)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  cardOfDay: {
    backgroundColor: 'rgba(15,23,42,0.18)',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    color: '#fff',
    fontSize: 15,
    marginTop: 6,
  },
  drawerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 70,
    backgroundColor: 'rgba(2,6,23,0.55)',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  drawerHandle: {
    width: 50,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modeCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    minHeight: 110,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 25,
  },
  modeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modeSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    marginTop: 4,
  },
});
