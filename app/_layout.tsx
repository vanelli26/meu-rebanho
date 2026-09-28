import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#111412',
          headerTitleStyle: { fontWeight: '700', fontSize: 20 },
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
    </>
  );
}
