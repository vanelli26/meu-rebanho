import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

type Tipo = 'info' | 'atencao' | 'perigo' | 'sucesso';

const config: Record<
  Tipo,
  { caixa: string; texto: string; cor: string; icone: ComponentProps<typeof Ionicons>['name'] }
> = {
  info: {
    caixa: 'bg-info-fundo border-info',
    texto: 'text-info',
    cor: '#0B3D91',
    icone: 'information-circle',
  },
  atencao: {
    caixa: 'bg-atencao-fundo border-atencao',
    texto: 'text-atencao',
    cor: '#7A4A00',
    icone: 'warning',
  },
  perigo: {
    caixa: 'bg-perigo-fundo border-perigo',
    texto: 'text-perigo',
    cor: '#A4161A',
    icone: 'alert-circle',
  },
  sucesso: {
    caixa: 'bg-sucesso-fundo border-sucesso',
    texto: 'text-sucesso',
    cor: '#0B5D1E',
    icone: 'checkmark-circle',
  },
};

type Props = {
  tipo?: Tipo;
  titulo: string;
  mensagem?: string;
};

export function Aviso({ tipo = 'info', titulo, mensagem }: Props) {
  const c = config[tipo];
  return (
    <View accessibilityRole="alert" className={`flex-row gap-3 rounded-xl border-2 p-4 ${c.caixa}`}>
      <Ionicons name={c.icone} size={28} color={c.cor} />
      <View className="flex-1 gap-1">
        <Text className={`text-lg font-bold ${c.texto}`}>{titulo}</Text>
        {mensagem ? <Text className="text-base text-texto">{mensagem}</Text> : null}
      </View>
    </View>
  );
}
