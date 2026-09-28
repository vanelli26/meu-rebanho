import { Stack } from 'expo-router';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

// Ao abrir um animal vindo de outra aba, a lista fica embaixo para o "voltar".
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen name="index" options={{ title: 'Rebanho', headerLargeTitle: true }} />
      <Stack.Screen name="novo" options={{ title: 'Novo animal', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/editar" options={{ title: 'Editar animal' }} />
    </Stack>
  );
}
