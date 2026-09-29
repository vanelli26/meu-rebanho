import { subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { brParaISO, isoParaBR, mascaraDataBR, paraDataISO, type DataISO } from '@/lib/datas';

import { CampoTexto, type CampoTextoProps } from './CampoTexto';
import { Texto } from './Texto';

type Props = Omit<CampoTextoProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  /** Data em `YYYY-MM-DD`, ou `null` enquanto incompleta/inválida. */
  valor: DataISO | null;
  aoMudar: (valor: DataISO | null) => void;
  /** Data de referência para os atalhos "Hoje" e "Ontem". */
  hoje?: Date;
};

export function CampoData({ valor, aoMudar, hoje = new Date(), ...props }: Props) {
  const [texto, setTexto] = useState(() => (valor ? isoParaBR(valor) : ''));
  if (valor && brParaISO(texto) !== valor) {
    setTexto(isoParaBR(valor));
  }

  const escolher = (data: Date) => {
    void Haptics.selectionAsync();
    const iso = paraDataISO(data);
    setTexto(isoParaBR(iso));
    aoMudar(iso);
  };

  const atalhos = [
    { titulo: 'Hoje', data: hoje },
    { titulo: 'Ontem', data: subDays(hoje, 1) },
  ];

  return (
    <View className="gap-3">
      <CampoTexto
        icone="calendar-outline"
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={texto}
        onChangeText={(novo) => {
          const mascarado = mascaraDataBR(novo);
          setTexto(mascarado);
          aoMudar(brParaISO(mascarado));
        }}
        {...props}
      />
      <View className="flex-row gap-2">
        {atalhos.map(({ titulo, data }) => {
          const ativo = valor === paraDataISO(data);
          return (
            <Pressable
              key={titulo}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              onPress={() => escolher(data)}
              className={`min-h-12 justify-center rounded-full px-5 active:opacity-70 ${
                ativo ? 'bg-primaria' : 'bg-superficie-2'
              }`}
            >
              <Texto variante="rotulo" tom={ativo ? 'sobre-primaria' : 'normal'}>
                {titulo}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
