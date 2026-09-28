import { Stack } from 'expo-router';

import { CabecalhoDireita } from '@/components/BotaoConta';
import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

// Vindo de outra aba (animal ou evento), a lista fica embaixo para o "voltar".
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Rebanho',
          headerLargeTitle: true,
          headerRight: () => <CabecalhoDireita />,
        }}
      />
      <Stack.Screen name="novo" options={{ title: 'Novo animal' }} />
      <Stack.Screen name="evento" options={{ title: 'Registrar evento' }} />
      <Stack.Screen name="[id]/index" options={{ title: '' }} />
      <Stack.Screen name="[id]/editar" options={{ title: 'Editar animal' }} />
    </Stack>
  );
}
