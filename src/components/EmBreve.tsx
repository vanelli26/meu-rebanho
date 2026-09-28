import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useTema } from '@/lib/tema';

import { Texto } from './ui/Texto';

type Props = {
  icone: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descricao: string;
};

/** Estado vazio para telas das próximas fases do roadmap. */
export function EmBreve({ icone, titulo, descricao }: Props) {
  const { cores } = useTema();
  return (
    <ScrollView
      className="bg-fundo"
      contentContainerClassName="flex-grow items-center justify-center gap-5 p-8"
    >
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primaria-suave">
          <Ionicons name={icone} size={40} color={cores.primaria} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).springify()} className="items-center gap-2">
        <Texto variante="titulo" className="text-center">
          {titulo}
        </Texto>
        <Texto tom="suave" className="text-center">
          {descricao}
        </Texto>
        <View className="mt-2 rounded-full bg-destaque-suave px-3 py-1">
          <Texto variante="legenda" tom="atencao">
            Em breve
          </Texto>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
