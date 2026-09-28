import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sair } from '@/auth/google';
import { Botao, Texto } from '@/components/ui';
import { useTema } from '@/lib/tema';

/** Logado, mas sem dados no aparelho e sem internet para buscá-los. */
export default function AguardandoRede() {
  const { cores } = useTema();
  const onda = useSharedValue(0);

  useEffect(() => {
    onda.set(withRepeat(withTiming(1, { duration: 1800 }), -1, false));
  }, [onda]);

  const animacaoOnda = useAnimatedStyle(() => ({
    opacity: 1 - onda.value,
    transform: [{ scale: 1 + onda.value * 0.8 }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <View className="flex-1 items-center justify-center gap-8 px-8">
        <View className="h-40 w-40 items-center justify-center">
          <Animated.View
            className="absolute h-28 w-28 rounded-full bg-primaria-suave"
            style={animacaoOnda}
          />
          <View className="h-28 w-28 items-center justify-center rounded-full bg-primaria-suave">
            <Ionicons name="cloud-offline-outline" size={48} color={cores.primaria} />
          </View>
        </View>
        <Animated.View entering={FadeInDown.springify()} className="items-center gap-3">
          <Texto variante="titulo" className="text-center">
            Aguardando conexão
          </Texto>
          <Texto tom="suave" className="text-center">
            Precisamos de internet uma vez para trazer os dados da sua fazenda para este celular. O
            app segue sozinho assim que a rede voltar.
          </Texto>
        </Animated.View>
      </View>
      <View className="px-6 pb-6">
        <Botao titulo="Sair da conta" variante="fantasma" onPress={() => void sair()} />
      </View>
    </SafeAreaView>
  );
}
