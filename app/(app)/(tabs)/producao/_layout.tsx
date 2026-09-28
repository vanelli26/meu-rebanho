import { Stack } from 'expo-router';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

// Ao lançar vindo do painel, o histórico fica embaixo para o "voltar".
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen name="index" options={{ title: 'Produção', headerLargeTitle: true }} />
      <Stack.Screen name="lancar" options={{ title: 'Lançar ordenha' }} />
    </Stack>
  );
}
