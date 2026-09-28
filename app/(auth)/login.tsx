import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entrarComGoogle } from '@/auth/google';
import { Paisagem } from '@/components/marca/Paisagem';
import { SeloLogo } from '@/components/marca/SeloLogo';
import { Aviso, Botao, Texto } from '@/components/ui';
import { marca } from '@/lib/tema';

export default function Login() {
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O login precisa do servidor, então aqui aguardar é correto.
  const entrar = async () => {
    setEntrando(true);
    setErro(null);
    const resultado = await entrarComGoogle();
    if (!resultado.ok) {
      setErro(resultado.mensagem);
      setEntrando(false);
    }
  };

  return (
    <LinearGradient colors={[marca.verdeClaro, marca.verde, marca.verdeEscuro]} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Paisagem altura={300} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center gap-6 px-8">
          <Animated.View entering={FadeInDown.duration(700).springify().damping(14)}>
            <SeloLogo tamanho={120} />
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(150).duration(600)}
            className="items-center gap-2"
          >
            <Texto variante="display" tom="creme" className="text-[40px] leading-[46px]">
              Meu Rebanho
            </Texto>
            <View className="h-1 w-12 rounded-full bg-[#C9A227]" />
            <Texto tom="creme-suave" className="mt-2 text-center text-[17px] leading-[25px]">
              Seu gado leiteiro na palma da mão.{'\n'}No curral, mesmo sem internet.
            </Texto>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(300).springify().damping(16)}
          className="gap-4 px-6 pb-6"
        >
          <Botao
            titulo="Entrar com Google"
            icone="logo-google"
            variante="claro"
            onPress={entrar}
            carregando={entrando}
          />
          {erro ? <Aviso tipo="perigo" titulo={erro} /> : null}
          <Animated.View entering={FadeIn.delay(600)}>
            <Texto variante="legenda" tom="creme-suave" className="text-center">
              O primeiro acesso precisa de internet.{'\n'}Depois, tudo funciona offline.
            </Texto>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}
