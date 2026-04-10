import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

// Simple icon replacements since lucide-react-native isn't available
const HomeIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20 }}>🏠</Text>
);

const SessionIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20 }}>⚡</Text>
);

const HealthIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20 }}>🍎</Text>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20 }}>👤</Text>
);

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#12121A',
          borderTopColor: '#1A1A26',
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          title: 'Seans',
          tabBarIcon: SessionIcon,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Sağlık',
          tabBarIcon: HealthIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tabs>
  );
}
