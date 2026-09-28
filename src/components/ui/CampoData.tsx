import { subDays } from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { brParaISO, isoParaBR, mascaraDataBR, paraDataISO, type DataISO } from '@/lib/datas';

import { CampoTexto, type CampoTextoProps } from './CampoTexto';

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
    const iso = paraDataISO(data);
    setTexto(isoParaBR(iso));
    aoMudar(iso);
  };

  return (
    <View className="gap-2">
      <CampoTexto
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
        <Atalho titulo="Hoje" aoPressionar={() => escolher(hoje)} />
        <Atalho titulo="Ontem" aoPressionar={() => escolher(subDays(hoje, 1))} />
      </View>
    </View>
  );
}

function Atalho({ titulo, aoPressionar }: { titulo: string; aoPressionar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={aoPressionar}
      className="min-h-12 justify-center rounded-lg border-2 border-borda bg-superficie px-4 active:opacity-70"
    >
      <Text className="text-base font-semibold text-texto">{titulo}</Text>
    </Pressable>
  );
}
