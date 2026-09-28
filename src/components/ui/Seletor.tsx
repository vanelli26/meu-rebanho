import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View } from 'react-native';

import { Texto } from './Texto';

export type Opcao<T extends string> = { valor: T; rotulo: string };

type Props<T extends string> = {
  rotulo?: string;
  opcoes: readonly Opcao<T>[];
  valor: T | null;
  aoMudar: (valor: T) => void;
  erro?: string;
  /** Rolagem horizontal em vez de quebrar linha (para listas longas de filtros). */
  rolavel?: boolean;
};

/** Grupo de pílulas para escolher uma opção (sexo, ordenha, tipo de evento...). */
export function Seletor<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
  erro,
  rolavel = false,
}: Props<T>) {
  const pilulas = opcoes.map((opcao) => {
    const ativo = opcao.valor === valor;
    return (
      <Pressable
        key={opcao.valor}
        accessibilityRole="radio"
        accessibilityState={{ selected: ativo }}
        onPress={() => {
          void Haptics.selectionAsync();
          aoMudar(opcao.valor);
        }}
        className={`min-h-12 justify-center rounded-full border-[1.5px] px-5 active:opacity-70 ${
          ativo ? 'border-primaria bg-primaria' : 'border-borda bg-superficie'
        }`}
      >
        <Texto variante="rotulo" tom={ativo ? 'sobre-primaria' : 'normal'} className="text-[15px]">
          {opcao.rotulo}
        </Texto>
      </Pressable>
    );
  });

  return (
    <View className="gap-2" accessibilityRole="radiogroup">
      {rotulo ? (
        <Texto variante="rotulo" tom="suave">
          {rotulo}
        </Texto>
      ) : null}
      {rolavel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4"
          className="-mx-4"
        >
          {pilulas}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{pilulas}</View>
      )}
      {erro ? (
        <Texto variante="legenda" tom="perigo">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}
