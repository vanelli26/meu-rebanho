import { Stack } from 'expo-router';

import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

// Ao abrir o registro vindo de outra aba, a agenda fica embaixo para o "voltar".
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen name="index" options={{ title: 'Reprodução', headerLargeTitle: true }} />
      <Stack.Screen name="registrar" options={{ title: 'Registrar evento' }} />
    </Stack>
  );
}
