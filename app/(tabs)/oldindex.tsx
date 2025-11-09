import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { auth } from '../../src/lib/firebase';
import { useActiveGroupId } from '../../src/modules/groups/useActiveGroup';
import { findOrCreateGroup } from '../../src/modules/groups/matching';
import * as Location from 'expo-location';

type Mode = {
  key: string;
  emoji: string;
  title: string;
  desc: string;
  active: boolean;
  stat?: string;
};

const MODES: Mode[] = [
  {
    key: 'random6',
    emoji: '🎲',
    title: 'Random 6',
    desc: '6 strangers. vote-to-kick. find friends for life.',
    active: true
  },
  {
    key: 'study',
    emoji: '📚',
    title: 'Study Room',
    desc: 'find study friends from your school.',
    active: false
  },
  {
    key: 'growingroom',
    emoji: '🚀',
    title: 'Growing Room',
    desc: 'everyday a new person joins. forever.',
    active: false
  },
  {
    key: 'city',
    emoji: '🌆',
    title: 'City Chat',
    desc: 'join with 6 people in your city',
    active: false
  },
      {
    key: 'biggroup',
    emoji: '🪩',
    title: 'Big Group',
    desc: '16 people. 1 group. chaos guaranteed',
    active: false
  },
  {
    key: '3v3',
    emoji: '🏝️',
    title: '3 vs 3',
    desc: '3 males, 3 females. see who you get along with',
    active: false
  },

];

export default function Home() {

  const [city, setCity] = useState<string | null>(null);

useEffect(() => {
  (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCity('Location off');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (place?.city) setCity(place.city);
      else if (place?.region) setCity(place.region);
      else setCity('Unknown');
    } catch (err) {
      console.log('location err', err);
      setCity('Unavailable');
    }
  })();
}, []);
  const router = useRouter();
  const uid = auth.currentUser?.uid ?? 'unknown';
  const activeGroupId = useActiveGroupId();
  const [isFinding, setIsFinding] = useState<boolean>(false);

  // if backend puts us in a group, go to chat
  useEffect(() => {
    if (activeGroupId) {
      router.replace({ pathname: '/chat/[groupId]', params: { groupId: activeGroupId } });
    }
  }, [activeGroupId, router]);

  const handleJoinRandom6 = async () => {
    if (!auth.currentUser || isFinding) return;
    setIsFinding(true);
    try {
      // for now: city + interest hardcoded
      const res = await findOrCreateGroup(uid, 'london', 'coding');
      if (res.startsWith('waiting:')) {
        Alert.alert('Queued', 'You’re in the waiting pool — we’ll move you into a group soon.');
      } else {
        router.replace({ pathname: '/chat/[groupId]', params: { groupId: res } });
      }
    } catch (err: any) {
      Alert.alert('Error', String(err?.message ?? err));
    } finally {
      setIsFinding(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* top quick cards */}
      <View style={styles.topRow}>
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>📍 Current Location</Text>
          <Text style={styles.topValue}>
            {city ? city : 'Detecting...'}
          </Text>
        </View>
        <Pressable style={styles.topCard}>
          <Text style={styles.topTitle}>Now Online</Text>
          <Text style={styles.topSub}>33.7k</Text>
        </Pressable>
      </View>

      {/* modes */}
      {MODES.map((mode) => (
        <View key={mode.key} style={styles.modeCard}>
          {/* left icon */}
          <View style={styles.iconBox}>
            <Text style={styles.iconEmoji}>{mode.emoji}</Text>
          </View>

          {/* center text */}
          <View style={styles.modeCenter}>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeDesc} numberOfLines={2}>
              {mode.desc}
            </Text>
          </View>

          {/* right actions/stats */}
          <View style={styles.modeRight}>
            {mode.active ? (
              <Pressable
                onPress={handleJoinRandom6}
                disabled={isFinding}
                style={({ pressed }) => [
                  styles.joinPill,
                  pressed && { opacity: 0.85 },
                  isFinding && { opacity: 0.6 },
                ]}
                hitSlop={8}
              >
                <Text style={styles.joinPillText}>{isFinding ? '...' : 'Join'}</Text>
              </Pressable>
            ) : (
              <View style={styles.soonPill}>
                <Text style={styles.soonText}>Soon</Text>
              </View>
            )}
          </View>
        </View>
      ))}

      <Text style={styles.uidHint}>uid: {uid}</Text>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  pageTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 14,
  },

  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  topCard: {
    flex: 1,
    backgroundColor: '#101113',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#17181a',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  topTitle: {
    color: '#eaeaea',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  topValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  topSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '400',
  },

  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#101113',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#17181a',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#13161a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 26,
  },

  modeCenter: {
    flex: 1,
  },
  modeTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  modeDesc: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  modeRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 10,
  },

  joinPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  joinPillText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 13,
  },

  soonPill: {
    backgroundColor: '#141517',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1e1f23',
  },
  soonText: {
    color: '#9ca3af',
    fontWeight: '500',
    fontSize: 12,
  },

  modeStat: {
    color: '#6b7280',
    fontSize: 11,
  },

  uidHint: {
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
  },
});
