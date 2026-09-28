import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useTema, type NomeCor } from '@/lib/tema';

import { Texto } from './Texto';

type Tipo = 'info' | 'atencao' | 'perigo' | 'sucesso';

const config: Record<
  Tipo,
  { fundo: string; cor: NomeCor; icone: ComponentProps<typeof Ionicons>['name'] }
> = {
  info: { fundo: 'bg-info-suave', cor: 'info', icone: 'information-circle' },
  atencao: { fundo: 'bg-atencao-suave', cor: 'atencao', icone: 'warning' },
  perigo: { fundo: 'bg-perigo-suave', cor: 'perigo', icone: 'alert-circle' },
  sucesso: { fundo: 'bg-sucesso-suave', cor: 'sucesso', icone: 'checkmark-circle' },
};

type Props = {
  tipo?: Tipo;
  titulo: string;
  mensagem?: string;
};

export function Aviso({ tipo = 'info', titulo, mensagem }: Props) {
  const { cores } = useTema();
  const c = config[tipo];
  return (
    <View>
      <View accessibilityRole="alert" className={`flex-row gap-3 rounded-2xl p-4 ${c.fundo}`}>
        <Ionicons name={c.icone} size={22} color={cores[c.cor]} />
        <View className="flex-1 gap-1">
          <Texto variante="rotulo" tom={c.cor as 'info'} className="text-[14px]">
            {titulo}
          </Texto>
          {mensagem ? (
            <Texto variante="legenda" className="text-[13px] leading-[18px]">
              {mensagem}
            </Texto>
          ) : null}
        </View>
      </View>
    </View>
  );
}
