import '../global.css';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { SessaoProvider, useSessao } from '@/auth/SessaoProvider';
import { fontes, useTema, varsDoTema } from '@/lib/tema';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
  const [fontesProntas] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const { escuro, cores } = useTema();

  // As variáveis CSS alimentam as classes do Tailwind (bg-fundo, text-primaria...).
  const estiloTema = useMemo(() => vars(varsDoTema(cores)), [cores]);

  const temaNavegacao = useMemo(() => {
    const base = escuro ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: cores.primaria,
        background: cores.fundo,
        card: cores.fundo,
        text: cores.texto,
        border: cores.borda,
      },
      fonts: {
        regular: { fontFamily: fontes.regular, fontWeight: '400' as const },
        medium: { fontFamily: fontes.medio, fontWeight: '500' as const },
        bold: { fontFamily: fontes.negrito, fontWeight: '700' as const },
        heavy: { fontFamily: fontes.extra, fontWeight: '800' as const },
      },
    };
  }, [escuro, cores]);

  if (!fontesProntas) return null;

  return (
    <View style={[{ flex: 1, backgroundColor: cores.fundo }, estiloTema]}>
      <ThemeProvider value={temaNavegacao}>
        <SessaoProvider>
          <StatusBar style="auto" />
          <Navegacao />
        </SessaoProvider>
      </ThemeProvider>
    </View>
  );
}

/** Guarda de rotas: login → criar fazenda → app. */
function Navegacao() {
  const { estado } = useSessao();
  const { cores } = useTema();

  useEffect(() => {
    if (estado !== 'carregando') SplashScreen.hide();
  }, [estado]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 350,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
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
