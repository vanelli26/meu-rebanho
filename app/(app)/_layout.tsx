import { Stack } from 'expo-router';

import { useSessao } from '@/auth/SessaoProvider';
import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { DadosFazendaProvider } from '@/features/DadosFazendaProvider';
import { useOpcoesCabecalho } from '@/lib/navegacao';

export default function AppLayout() {
  const { estado } = useSessao();
  const opcoes = useOpcoesCabecalho();
  // Durante o logout a guarda ainda não trocou de tela; não renderiza telas que exigem fazenda.
  if (estado !== 'pronto') return null;
  return (
    <DadosFazendaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
        <Stack.Screen name="(tabs)" />
        {/* Aberta pela foto do usuário no Painel. */}
        <Stack.Screen
          name="mais"
          options={{
            ...opcoes,
            headerShown: true,
            title: 'Conta e fazenda',
            headerRight: () => <IndicadorSyncAtual />,
          }}
        />
      </Stack>
    </DadosFazendaProvider>
  );
}
