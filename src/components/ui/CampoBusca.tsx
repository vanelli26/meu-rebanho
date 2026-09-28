import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { fontes, useTema } from '@/lib/tema';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  valor: string;
  aoMudar: (texto: string) => void;
};

/** Campo de busca de animais pelo nome (também encontra pelo brinco). */
export function CampoBusca({ valor, aoMudar, placeholder = 'Buscar pelo nome', ...props }: Props) {
  const { cores } = useTema();

  return (
    <View className="min-h-14 flex-row items-center gap-2 rounded-2xl border-[1.5px] border-borda bg-superficie pl-4 pr-2">
      <Ionicons name="search" size={20} color={cores.textoSuave} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSuave + '99'}
        selectionColor={cores.primaria}
        value={valor}
        onChangeText={aoMudar}
        autoCapitalize="words"
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
    </View>
  );
}
