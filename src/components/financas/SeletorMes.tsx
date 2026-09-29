import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { nomeDoMes, somarMeses, type MesISO } from '@/lib/datas';
import { useTema } from '@/lib/tema';

import { Texto } from '../ui/Texto';

type Props = { mes: MesISO; aoMudar: (mes: MesISO) => void; mesAtual: MesISO };

/** "‹ setembro de 2026 ›". Não avança além do mês atual. */
export function SeletorMes({ mes, aoMudar, mesAtual }: Props) {
  const { cores } = useTema();
  const podeAvancar = mes < mesAtual;
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-superficie px-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mês anterior"
        onPress={() => aoMudar(somarMeses(mes, -1))}
        className="h-12 w-12 items-center justify-center active:opacity-60"
      >
        <Ionicons name="chevron-back" size={22} color={cores.primaria} />
      </Pressable>
      <Texto variante="subtitulo" className="capitalize">
        {nomeDoMes(mes)}
      </Texto>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Próximo mês"
        disabled={!podeAvancar}
        onPress={() => aoMudar(somarMeses(mes, 1))}
        className={`h-12 w-12 items-center justify-center active:opacity-60 ${
          podeAvancar ? '' : 'opacity-30'
        }`}
      >
        <Ionicons name="chevron-forward" size={22} color={cores.primaria} />
      </Pressable>
    </View>
  );
}
