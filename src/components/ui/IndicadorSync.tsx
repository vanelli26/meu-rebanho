import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTema } from '@/lib/tema';

import { Texto } from './Texto';

type Props = {
  /** `true` quando há gravações locais ainda não confirmadas pelo servidor. */
  pendente: boolean;
};

/** Selo discreto no topo indicando gravações aguardando sincronização. */
export function IndicadorSync({ pendente }: Props) {
  const { cores } = useTema();
  const pulso = useSharedValue(1);

  useEffect(() => {
    pulso.set(pendente ? withRepeat(withTiming(0.35, { duration: 800 }), -1, true) : 1);
  }, [pendente, pulso]);

  const animacao = useAnimatedStyle(() => ({ opacity: pulso.value }));

  if (!pendente) return null;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View
        accessibilityRole="text"
        accessibilityLabel="Dados aguardando sincronização"
        className="flex-row items-center gap-1.5 rounded-full bg-destaque-suave px-3 py-1.5"
      >
        <Animated.View style={animacao}>
          <Ionicons name="cloud-upload" size={15} color={cores.atencao} />
        </Animated.View>
        <Texto variante="legenda" tom="atencao">
          Sincronizando
        </Texto>
      </View>
    </Animated.View>
  );
}
