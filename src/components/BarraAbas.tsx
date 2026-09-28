import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState, type ComponentProps } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTecladoVisivel } from '@/lib/teclado';
import { useTema } from '@/lib/tema';

import { Texto } from './ui/Texto';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

const ICONES: Record<string, [NomeIcone, NomeIcone]> = {
  index: ['home-outline', 'home'],
  rebanho: ['paw-outline', 'paw'],
  producao: ['water-outline', 'water'],
};

const MARGEM = 16;
const ALTURA = 68;

/** Barra de abas flutuante; a aba ativa fica destacada. */
export function BarraAbas({ state, descriptors, navigation }: BottomTabBarProps) {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const [largura, setLargura] = useState(0);
  const larguraAba = largura / state.routes.length;
  // No Android a barra subiria junto com o teclado e cobriria os campos.
  const tecladoVisivel = useTecladoVisivel();

  const conteudo = (
    <View
      className="flex-1 flex-row items-center"
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
    >
      {largura > 0 ? (
        <View
          className="absolute h-[52px] rounded-[22px] bg-primaria-suave"
          style={{ width: larguraAba - 12, left: state.index * larguraAba + 6 }}
        />
      ) : null}
      {state.routes.map((rota, i) => {
        const ativa = state.index === i;
        const { options } = descriptors[rota.key];
        const titulo = typeof options.title === 'string' ? options.title : rota.name;
        const [contorno, cheio] = ICONES[rota.name] ?? ['ellipse-outline', 'ellipse'];

        return (
          <Pressable
            key={rota.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={titulo}
            onPress={() => {
              const evento = navigation.emit({
                type: 'tabPress',
                target: rota.key,
                canPreventDefault: true,
              });
              if (!ativa && !evento.defaultPrevented) {
                void Haptics.selectionAsync();
                navigation.navigate(rota.name, rota.params);
              }
            }}
            className="h-full flex-1 items-center justify-center gap-0.5"
          >
            <Ionicons
              name={ativa ? cheio : contorno}
              size={22}
              color={ativa ? cores.primaria : cores.textoSuave}
            />
            <Texto
              variante="legenda"
              tom={ativa ? 'primaria' : 'suave'}
              className={`text-[11px] ${ativa ? 'font-negrito' : ''}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {titulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );

  if (tecladoVisivel && Platform.OS === 'android') return null;

  return (
    <View
      style={{
        position: 'absolute',
        left: MARGEM,
        right: MARGEM,
        bottom: Math.max(insets.bottom, 12),
        height: ALTURA,
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: escuro
          ? '0px 8px 30px rgba(0, 0, 0, 0.5)'
          : '0px 10px 30px rgba(23, 58, 44, 0.16)',
        borderWidth: escuro ? 1 : 0,
        borderColor: cores.borda,
      }}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={60}
          tint={escuro ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={{ flex: 1, paddingHorizontal: 0 }}
        >
          {conteudo}
        </BlurView>
      ) : (
        <View style={{ flex: 1, backgroundColor: cores.superficie }}>{conteudo}</View>
      )}
    </View>
  );
}

/** Espaço a reservar no fim das telas para o conteúdo não ficar sob a barra. */
export const ESPACO_BARRA_ABAS = ALTURA + 36;
