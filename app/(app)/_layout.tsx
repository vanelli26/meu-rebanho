import { Stack } from 'expo-router';

import { useSessao } from '@/auth/SessaoProvider';
import { DadosFazendaProvider } from '@/features/DadosFazendaProvider';

export default function AppLayout() {
  const { estado } = useSessao();
  // Durante o logout a guarda ainda não trocou de tela; não renderiza telas que exigem fazenda.
  if (estado !== 'pronto') return null;
  return (
    <DadosFazendaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'ios_from_right' }} />
    </DadosFazendaProvider>
  );
}
