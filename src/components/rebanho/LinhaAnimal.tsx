import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { identificacao, ROTULO_STATUS, situacaoAtual, type Animal } from '@/domain/animal';
import { useTema } from '@/lib/tema';

import { Texto } from '../ui/Texto';
import { SeloSituacao } from './SeloSituacao';

type Props = {
  animal: Animal;
  hoje: Date;
  detalhe?: string;
  onPress: () => void;
  selecionado?: boolean;
};

/** Linha da lista de animais: nome e situação. O brinco fica só no cadastro. */
export function LinhaAnimal({ animal, hoje, detalhe, onPress, selecionado }: Props) {
  const { cores } = useTema();
  const inativo = animal.status !== 'ativo';
  const nome = identificacao(animal);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={nome}
      onPress={onPress}
      className={`min-h-16 flex-row items-center gap-4 rounded-2xl px-4 py-3 active:opacity-70 ${
        selecionado ? 'border-[1.5px] border-primaria bg-primaria-suave' : 'bg-superficie'
      }`}
    >
      <View
        className={`h-12 w-12 items-center justify-center rounded-full ${
          inativo ? 'bg-superficie-2' : 'bg-primaria-suave'
        }`}
      >
        <Texto variante="subtitulo" tom={inativo ? 'suave' : 'primaria'} className="font-extra">
          {nome.charAt(0).toUpperCase()}
        </Texto>
      </View>
      <View className="flex-1 gap-1">
        <Texto variante="subtitulo" className="text-[15px]" numberOfLines={1}>
          {nome}
        </Texto>
        {inativo ? (
          <Texto variante="legenda" tom="suave">
            {ROTULO_STATUS[animal.status]}
          </Texto>
        ) : (
          <SeloSituacao situacao={situacaoAtual(animal, hoje)} prenhe={animal.resumo.prenhe} />
        )}
        {detalhe ? (
          <Texto variante="legenda" tom="suave">
            {detalhe}
          </Texto>
        ) : null}
      </View>
      <Ionicons
        name={selecionado ? 'checkmark-circle' : 'chevron-forward'}
        size={selecionado ? 24 : 18}
        color={selecionado ? cores.primaria : cores.textoSuave}
      />
    </Pressable>
  );
}
