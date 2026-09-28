import type { Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

export type CampoTextoProps = TextInputProps & {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  ref?: Ref<TextInput>;
};

export function CampoTexto({ rotulo, erro, ajuda, ref, ...props }: CampoTextoProps) {
  return (
    <View className="gap-1">
      <Text className="text-base font-semibold text-texto">{rotulo}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={rotulo}
        placeholderTextColor="#5C6360"
        className={`min-h-toque rounded-xl border-2 bg-fundo px-4 text-lg text-texto ${
          erro ? 'border-perigo' : 'border-borda'
        }`}
        {...props}
      />
      {erro ? (
        <Text className="text-base font-semibold text-perigo">{erro}</Text>
      ) : ajuda ? (
        <Text className="text-base text-texto-suave">{ajuda}</Text>
      ) : null}
    </View>
  );
}
