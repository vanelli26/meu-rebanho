import { Stack } from 'expo-router';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen name="index" options={{ title: 'Rebanho', headerLargeTitle: true }} />
    </Stack>
  );
}
