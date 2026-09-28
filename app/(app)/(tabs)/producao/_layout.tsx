import { Stack } from 'expo-router';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { opcoesCabecalho } from '@/lib/tema';

export default function Layout() {
  return (
    <Stack screenOptions={{ ...opcoesCabecalho, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen name="index" options={{ title: 'Produção' }} />
    </Stack>
  );
}
