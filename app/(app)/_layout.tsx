import { Stack } from 'expo-router';

import { useSessao } from '@/auth/SessaoProvider';

export default function AppLayout() {
  const { estado } = useSessao();
  // Durante o logout a guarda ainda não trocou de tela; não renderiza telas que exigem fazenda.
  if (estado !== 'pronto') return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
