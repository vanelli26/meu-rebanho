import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type Props = {
  /** `true` quando há gravações locais ainda não confirmadas pelo servidor. */
  pendente: boolean;
};

/** Ícone discreto no topo indicando gravações aguardando sincronização. */
export function IndicadorSync({ pendente }: Props) {
  if (!pendente) return null;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="Dados aguardando sincronização"
      className="flex-row items-center gap-1 rounded-full bg-atencao-fundo px-3 py-1"
    >
      <Ionicons name="cloud-upload-outline" size={18} color="#7A4A00" />
      <Text className="text-sm font-semibold text-atencao">Pendente</Text>
    </View>
  );
}
