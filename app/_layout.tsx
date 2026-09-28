import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SessaoProvider, useSessao } from '@/auth/SessaoProvider';
import { cores } from '@/lib/tema';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessaoProvider>
      <StatusBar style="dark" />
      <Navegacao />
    </SessaoProvider>
  );
}

/** Guarda de rotas: login → criar fazenda → app. */
function Navegacao() {
  const { estado } = useSessao();

  useEffect(() => {
    if (estado !== 'carregando') SplashScreen.hide();
  }, [estado]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }}>
      <Stack.Protected guard={estado === 'deslogado' || estado === 'carregando'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={estado === 'aguardando-rede'}>
        <Stack.Screen name="aguardando-rede" />
      </Stack.Protected>
      <Stack.Protected guard={estado === 'sem-fazenda'}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={estado === 'pronto'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
