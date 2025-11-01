import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import AuthGate from '../../src/modules/auth/AuthGate';

export default function RootLayout() {
  return (
    <AuthGate>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0, // ✅ stick to bottom
            backgroundColor: '#111',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 80 : 70,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10, // center vertically
            paddingTop: Platform.OS === 'ios' ? 20 : 10, // center vertically 
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: 'hidden',
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: '#555',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconWrapper focused={focused}>
                <Ionicons name="home-outline" size={26} color={color} />
              </IconWrapper>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconWrapper focused={focused}>
                <Ionicons name="chatbubble-ellipses-outline" size={26} color={color} />
              </IconWrapper>
            ),
          }}
        />
        <Tabs.Screen
          name="trending"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconWrapper focused={focused}>
                <Ionicons name="trending-up-outline" size={26} color={color} />
              </IconWrapper>
            ),
          }}
        />
        <Tabs.Screen
          name="premium"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <IconWrapper focused={focused}>
                <Ionicons name="star-outline" size={26} color={color} />
              </IconWrapper>
            ),
          }}
        />
      </Tabs>
    </AuthGate>
  );
}

function IconWrapper({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.focusedIcon]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  focusedIcon: {
    backgroundColor: '',
  },
});
