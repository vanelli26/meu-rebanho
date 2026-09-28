import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { Ref } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { mascaraDecimal } from '@/lib/numeros';
import { fontes, useTema } from '@/lib/tema';

import { Texto } from '../ui/Texto';

type Props = {
  /** Nome que identifica a vaca (`identificacao`). */
  nome: string;
  texto: string;
  aoMudarTexto: (texto: string) => void;
  descartado: boolean;
  aoAlternarDescarte: () => void;
  emCarencia: boolean;
  erro?: string;
  ultimo: boolean;
  aoAvancar: () => void;
  ref?: Ref<TextInput>;
};

/** Uma vaca na ordenha: nome, litros (teclado numérico) e botão de descarte. */
export function LinhaLitros({
  nome,
  texto,
  aoMudarTexto,
  descartado,
  aoAlternarDescarte,
  emCarencia,
  erro,
  ultimo,
  aoAvancar,
  ref,
}: Props) {
  const { cores } = useTema();
  const borda = erro ? cores.perigo : descartado ? cores.perigo + '66' : cores.borda;

  return (
    <View
      className={`gap-1 rounded-2xl px-3 py-2 ${descartado ? 'bg-perigo-suave' : 'bg-superficie'}`}
    >
      <View className="min-h-14 flex-row items-center gap-3">
        <View className="flex-1">
          <Texto variante="subtitulo" className="text-[15px]" numberOfLines={1}>
            {nome}
          </Texto>
          {descartado ? (
            <Texto variante="legenda" tom="perigo">
              {emCarencia ? 'Em carência · descartar' : 'Descartado'}
            </Texto>
          ) : null}
        </View>
        <View
          className="h-14 w-28 flex-row items-center rounded-2xl border-[1.5px] bg-superficie px-3"
          style={{ borderColor: borda }}
        >
          <TextInput
            ref={ref}
            accessibilityLabel={`Litros da ${nome}`}
            value={texto}
            onChangeText={(novo) => aoMudarTexto(mascaraDecimal(novo))}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0"
            placeholderTextColor={cores.textoSuave + '66'}
            selectionColor={cores.primaria}
            returnKeyType={ultimo ? 'done' : 'next'}
            submitBehavior={ultimo ? 'blurAndSubmit' : 'submit'}
            onSubmitEditing={aoAvancar}
            selectTextOnFocus
            maxLength={5}
            style={{
              fontFamily: fontes.extra,
              fontSize: 20,
              color: cores.texto,
              textAlign: 'right',
            }}
            className="flex-1 py-2"
          />
          <Texto variante="rotulo" tom="suave" className="ml-1">
            L
          </Texto>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: descartado }}
          accessibilityLabel="Descartar leite desta vaca"
          onPress={() => {
            void Haptics.selectionAsync();
            aoAlternarDescarte();
          }}
          className={`h-12 w-12 items-center justify-center rounded-xl active:opacity-70 ${
            descartado ? 'bg-perigo' : 'bg-superficie-2'
          }`}
        >
          <Ionicons
            name={descartado ? 'trash' : 'trash-outline'}
            size={20}
            color={descartado ? cores.superficie : cores.textoSuave}
          />
        </Pressable>
      </View>
      {erro ? (
        <Texto variante="legenda" tom="perigo" className="text-right">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}
