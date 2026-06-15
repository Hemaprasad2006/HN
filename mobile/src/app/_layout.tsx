import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LayoutDashboard, Calendar, Timer, Repeat, User } from 'lucide-react-native';
import { useFocusStore } from '@/stores/useFocusStore';

export default function TabLayout() {
  const isFocusRunning = useFocusStore((s) => s.isFocusRunning);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#121826',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.04)',
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
            // Dynamically hide tab bar on Focus tab when timer is actively running
            display: isFocusRunning ? 'none' : 'flex',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="planner"
          options={{
            title: 'Planner',
            tabBarIcon: ({ color }) => <Calendar color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="focus"
          options={{
            title: 'Focus',
            tabBarIcon: ({ color }) => <Timer color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="habits"
          options={{
            title: 'Habits',
            tabBarIcon: ({ color }) => <Repeat color={color} size={20} />,
          }}
        />
        <Tabs.Screen
          name="life"
          options={{
            title: 'Life',
            tabBarIcon: ({ color }) => <User color={color} size={20} />,
          }}
        />
      </Tabs>
    </>
  );
}
