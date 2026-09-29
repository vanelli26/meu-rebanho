import { Stack } from 'expo-router';

import { CabecalhoDireita } from '@/components/BotaoConta';
import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { useOpcoesCabecalho } from '@/lib/navegacao';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const opcoes = useOpcoesCabecalho();
  return (
    <Stack screenOptions={{ ...opcoes, headerRight: () => <IndicadorSyncAtual /> }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Finanças',
          headerLargeTitle: true,
          headerRight: () => <CabecalhoDireita />,
        }}
      />
      <Stack.Screen name="precos" options={{ title: 'Preço do leite' }} />
      <Stack.Screen name="preco" options={{ title: 'Novo preço' }} />
      <Stack.Screen name="despesa" options={{ title: 'Lançar despesa' }} />
      <Stack.Screen name="animais" options={{ title: 'Resultado por animal' }} />
    </Stack>
  );
}
