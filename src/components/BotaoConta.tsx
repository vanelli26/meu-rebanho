import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useSessaoPronta } from '@/auth/SessaoProvider';

import { Avatar } from './Avatar';
import { IndicadorSyncAtual } from './IndicadorSyncAtual';

/** Foto do usuário que abre "Conta e fazenda". Presente no topo de todas as abas. */
export function BotaoConta({ tamanho = 44 }: { tamanho?: number }) {
  const { conta } = useSessaoPronta();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Conta e configurações"
      hitSlop={8}
      onPress={() => router.push('/mais')}
    >
      <Avatar nome={conta.nome} fotoUrl={conta.fotoUrl} tamanho={tamanho} />
    </Pressable>
  );
}

/** Lado direito do cabeçalho das listas: sincronização e conta. */
export function CabecalhoDireita() {
  return (
    <View className="flex-row items-center gap-3">
      <IndicadorSyncAtual />
      <BotaoConta tamanho={34} />
    </View>
  );
}
