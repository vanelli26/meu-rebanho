import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { useTema, type NomeCor } from '@/lib/tema';

import { Texto, type TomTexto } from './Texto';

type Variante = 'primaria' | 'destaque' | 'secundaria' | 'fantasma' | 'perigo' | 'claro';

const estilos: Record<Variante, { fundo: string; tom: TomTexto; cor: NomeCor | 'branco' }> = {
  primaria: { fundo: 'bg-primaria', tom: 'sobre-primaria', cor: 'sobrePrimaria' },
  destaque: { fundo: 'bg-destaque', tom: 'primaria-forte', cor: 'primariaForte' },
  secundaria: { fundo: 'bg-primaria-suave', tom: 'primaria', cor: 'primaria' },
  fantasma: { fundo: 'bg-transparent', tom: 'primaria', cor: 'primaria' },
  perigo: { fundo: 'bg-perigo-suave', tom: 'perigo', cor: 'perigo' },
  claro: { fundo: 'bg-white', tom: 'grafite', cor: 'branco' },
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
  ...props
}: Props) {
  const { cores } = useTema();

  const estilo = estilos[variante];
  const corIcone = estilo.cor === 'branco' ? '#1C1F1D' : cores[estilo.cor];
  const desativado = disabled || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado, busy: carregando }}
      disabled={desativado}
      onPress={(e) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      className={className}
      {...props}
    >
      {({ pressed }) => (
        <View
          className={`flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
            compacto ? 'min-h-12' : 'min-h-[52px]'
          } ${estilo.fundo}`}
          style={{ opacity: desativado ? 0.5 : pressed ? 0.8 : 1 }}
        >
          {carregando ? (
            <ActivityIndicator color={corIcone} />
          ) : (
            <View className="flex-row items-center gap-2">
              {icone ? <Ionicons name={icone} size={20} color={corIcone} /> : null}
              <Texto variante="subtitulo" tom={estilo.tom}>
                {titulo}
              </Texto>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
