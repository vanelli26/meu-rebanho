import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { fontes, useTema } from '@/lib/tema';

import { Texto } from './Texto';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  valor: string;
  aoMudar: (texto: string) => void;
};

/**
 * Campo de busca por brinco ou nome. Abre com o teclado numérico (brinco) e
 * tem um botão para trocar para letras.
 */
export function CampoBusca({ valor, aoMudar, placeholder = 'Brinco ou nome', ...props }: Props) {
  const { cores } = useTema();
  const [numerico, setNumerico] = useState(true);

  return (
    <View className="min-h-14 flex-row items-center gap-2 rounded-2xl border-[1.5px] border-borda bg-superficie pl-4 pr-2">
      <Ionicons name="search" size={20} color={cores.textoSuave} />
      <TextInput
        // Trocar o teclado exige remontar o campo no Android.
        key={numerico ? 'numerico' : 'texto'}
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSuave + '99'}
        selectionColor={cores.primaria}
        value={valor}
        onChangeText={aoMudar}
        keyboardType={numerico ? 'number-pad' : 'default'}
        autoCorrect={false}
        returnKeyType="search"
        style={{ fontFamily: fontes.medio, fontSize: 16, color: cores.texto }}
        className="flex-1 py-3"
        {...props}
      />
      {valor ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          hitSlop={12}
          onPress={() => aoMudar('')}
          className="h-10 w-10 items-center justify-center"
        >
          <Ionicons name="close-circle" size={20} color={cores.textoSuave} />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={numerico ? 'Usar teclado de letras' : 'Usar teclado numérico'}
        onPress={() => setNumerico((n) => !n)}
        className="h-10 min-w-12 items-center justify-center rounded-xl bg-superficie-2 px-2 active:opacity-70"
      >
        <Texto variante="rotulo" tom="primaria">
          {numerico ? 'ABC' : '123'}
        </Texto>
      </Pressable>
    </View>
  );
}
