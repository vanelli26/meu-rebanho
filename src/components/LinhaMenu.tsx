import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';

import { useTema, type NomeCor } from '@/lib/tema';

import { Texto } from './ui/Texto';

type Props = {
  icone: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  detalhe?: string;
  selo?: string;
  cor?: 'primaria' | 'perigo' | 'destaque' | 'info';
  onPress?: () => void;
  ultimo?: boolean;
};

const fundos = {
  primaria: 'bg-primaria-suave',
  perigo: 'bg-perigo-suave',
  destaque: 'bg-destaque-suave',
  info: 'bg-info-suave',
} as const;

/** Linha de lista agrupada (estilo ajustes do sistema). */
export function LinhaMenu({
  icone,
  titulo,
  detalhe,
  selo,
  cor = 'primaria',
  onPress,
  ultimo,
}: Props) {
  const { cores } = useTema();
  const corIcone: NomeCor = cor === 'destaque' ? 'atencao' : cor;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      className="active:bg-superficie-2"
    >
      <View className="min-h-16 flex-row items-center gap-4 px-4">
        <View className={`h-10 w-10 items-center justify-center rounded-xl ${fundos[cor]}`}>
          <Ionicons name={icone} size={20} color={cores[corIcone]} />
        </View>
        <View
          className={`flex-1 flex-row items-center gap-2 self-stretch py-3 ${ultimo ? '' : 'border-b border-borda'}`}
        >
          <View className="flex-1">
            <Texto
              variante="subtitulo"
              tom={cor === 'perigo' ? 'perigo' : 'normal'}
              className="text-[15px]"
            >
              {titulo}
            </Texto>
            {detalhe ? (
              <Texto variante="legenda" tom="suave">
                {detalhe}
              </Texto>
            ) : null}
          </View>
          {selo ? (
            <View className="rounded-full bg-destaque-suave px-2.5 py-0.5">
              <Texto variante="legenda" tom="atencao" className="text-[11px]">
                {selo}
              </Texto>
            </View>
          ) : null}
          {onPress && cor !== 'perigo' ? (
            <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
