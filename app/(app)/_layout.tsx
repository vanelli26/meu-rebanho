import { Stack } from 'expo-router';

import { useSessao } from '@/auth/SessaoProvider';
import { IndicadorSyncAtual } from '@/components/IndicadorSyncAtual';
import { DadosFazendaProvider } from '@/features/DadosFazendaProvider';
import { FinanceiroProvider } from '@/features/FinanceiroProvider';
import { useAgendarLembretes } from '@/features/lembretes';
import { useOpcoesCabecalho } from '@/lib/navegacao';

const TELAS = {
  mais: 'Conta e fazenda',
  tratamento: 'Registrar tratamento',
  prazos: 'Prazos reprodutivos',
  exportar: 'Exportar planilha',
  lembretes: 'Lembretes',
};

export default function AppLayout() {
  const { estado } = useSessao();
  const opcoes = useOpcoesCabecalho();
  // Durante o logout a guarda ainda não trocou de tela; não renderiza telas que exigem fazenda.
  if (estado !== 'pronto') return null;
  return (
    <DadosFazendaProvider>
      <FinanceiroProvider>
        <AgendadorLembretes />
        <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }}>
          <Stack.Screen name="(tabs)" />
          {/* Telas fora das abas, abertas por Conta e fazenda ou pelo detalhe do animal. */}
          {Object.entries(TELAS).map(([name, title]) => (
            <Stack.Screen
              key={name}
              name={name}
              options={{
                ...opcoes,
                headerShown: true,
                title,
                headerRight: () => <IndicadorSyncAtual />,
              }}
            />
          ))}
        </Stack>
      </FinanceiroProvider>
    </DadosFazendaProvider>
  );
}

/** Mantém os lembretes do aparelho em dia com os dados da fazenda. */
function AgendadorLembretes() {
  useAgendarLembretes();
  return null;
}
