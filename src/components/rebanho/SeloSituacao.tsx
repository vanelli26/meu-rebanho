import { View } from 'react-native';

import { ROTULO_SITUACAO, type Situacao } from '@/domain/animal';

import { Texto, type TomTexto } from '../ui/Texto';

const ESTILO: Record<Situacao, { fundo: string; tom: TomTexto }> = {
  lactacao: { fundo: 'bg-sucesso-suave', tom: 'sucesso' },
  seca: { fundo: 'bg-info-suave', tom: 'info' },
  novilha: { fundo: 'bg-destaque-suave', tom: 'atencao' },
  bezerra: { fundo: 'bg-primaria-suave', tom: 'primaria' },
  macho: { fundo: 'bg-superficie-2', tom: 'suave' },
};

export function SeloSituacao({ situacao, prenhe }: { situacao: Situacao; prenhe?: boolean }) {
  const estilo = ESTILO[situacao];
  return (
    <View className="flex-row gap-1.5">
      <View className={`rounded-full px-2.5 py-0.5 ${estilo.fundo}`}>
        <Texto variante="legenda" tom={estilo.tom} className="text-[12px]">
          {ROTULO_SITUACAO[situacao]}
        </Texto>
      </View>
      {prenhe ? (
        <View className="rounded-full bg-perigo-suave px-2.5 py-0.5">
          <Texto variante="legenda" tom="perigo" className="text-[12px]">
            Prenhe
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
