import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTema, type NomeCor } from '@/lib/tema';

import { Texto } from './Texto';

type Variante = 'primaria' | 'destaque' | 'secundaria' | 'fantasma' | 'perigo' | 'claro';

const estilos: Record<Variante, { fundo: string; texto: string; cor: NomeCor | 'branco' }> = {
  primaria: { fundo: 'bg-primaria', texto: 'text-sobre-primaria', cor: 'sobrePrimaria' },
  destaque: { fundo: 'bg-destaque', texto: 'text-primaria-forte', cor: 'primariaForte' },
  secundaria: { fundo: 'bg-primaria-suave', texto: 'text-primaria', cor: 'primaria' },
  fantasma: { fundo: 'bg-transparent', texto: 'text-primaria', cor: 'primaria' },
  perigo: { fundo: 'bg-perigo-suave', texto: 'text-perigo', cor: 'perigo' },
  claro: { fundo: 'bg-white', texto: 'text-[#1C1F1D]', cor: 'branco' },
};

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  icone?: ComponentProps<typeof Ionicons>['name'];
  carregando?: boolean;
  compacto?: boolean;
  className?: string;
};

export function Botao({
  titulo,
  variante = 'primaria',
  icone,
  carregando = false,
  compacto = false,
  disabled,
  className = '',
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const { cores } = useTema();
  const escala = useSharedValue(1);
  const animacao = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  const estilo = estilos[variante];
  const corIcone = estilo.cor === 'branco' ? '#1C1F1D' : cores[estilo.cor];
  const desativado = disabled || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado, busy: carregando }}
      disabled={desativado}
      onPressIn={(e) => {
        escala.set(withSpring(0.96, { damping: 18, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        escala.set(withSpring(1, { damping: 14, stiffness: 300 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      className={className}
      {...props}
    >
      <Animated.View
        style={animacao}
        className={`flex-row items-center justify-center gap-2 rounded-2xl px-6 ${
          compacto ? 'min-h-12' : 'min-h-14'
        } ${estilo.fundo} ${desativado ? 'opacity-50' : ''}`}
      >
        {carregando ? (
          <ActivityIndicator color={corIcone} />
        ) : (
          <View className="flex-row items-center gap-2">
            {icone ? <Ionicons name={icone} size={20} color={corIcone} /> : null}
            <Texto variante="subtitulo" className={`${estilo.texto} text-[17px]`}>
              {titulo}
            </Texto>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
