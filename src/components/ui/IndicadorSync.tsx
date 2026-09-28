import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useTema } from '@/lib/tema';

import { Texto } from './Texto';

type Props = {
  /** `true` quando há gravações locais ainda não confirmadas pelo servidor. */
  pendente: boolean;
};

/** Selo discreto no topo indicando gravações aguardando sincronização. */
export function IndicadorSync({ pendente }: Props) {
  const { cores } = useTema();
  if (!pendente) return null;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Dados aguardando sincronização"
      className="flex-row items-center gap-1.5 rounded-full bg-destaque-suave px-3 py-1.5"
    >
      <Ionicons name="cloud-upload" size={15} color={cores.atencao} />
      <Texto variante="legenda" tom="atencao">
        Sincronizando
      </Texto>
    </View>
  );
}
