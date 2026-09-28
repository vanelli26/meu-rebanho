import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { fontes, useTema } from '@/lib/tema';

import { Texto } from './Texto';

export type CampoTextoProps = TextInputProps & {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  icone?: ComponentProps<typeof Ionicons>['name'];
  ref?: Ref<TextInput>;
};

export function CampoTexto({
  rotulo,
  erro,
  ajuda,
  icone,
  ref,
  onFocus,
  onBlur,
  ...props
}: CampoTextoProps) {
  const { cores } = useTema();
  const [focado, setFocado] = useState(false);

  const borda = erro ? 'border-perigo' : focado ? 'border-primaria' : 'border-borda';
  const corIcone = erro ? cores.perigo : focado ? cores.primaria : cores.textoSuave;

  return (
    <View className="gap-2">
      <Texto variante="rotulo" tom="suave">
        {rotulo}
      </Texto>
      <View
        className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-[1.5px] bg-superficie px-4 ${borda}`}
      >
        {icone ? <Ionicons name={icone} size={20} color={corIcone} /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={rotulo}
          placeholderTextColor={cores.textoSuave + '99'}
          selectionColor={cores.primaria}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          style={{ fontFamily: fontes.medio, fontSize: 17, color: cores.texto }}
          className="flex-1 py-3"
          {...props}
        />
      </View>
      {erro ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <Texto variante="legenda" tom="perigo">
            {erro}
          </Texto>
        </Animated.View>
      ) : ajuda ? (
        <Texto variante="legenda" tom="suave">
          {ajuda}
        </Texto>
      ) : null}
    </View>
  );
}
