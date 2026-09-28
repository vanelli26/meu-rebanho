import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sair } from '@/auth/google';
import { Aviso, Botao } from '@/components/ui';

/** Logado, mas sem dados no aparelho e sem internet para buscá-los. */
export default function AguardandoRede() {
  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <View className="flex-1 justify-center gap-6 px-6">
        <Text className="text-2xl font-bold text-texto">Conectando…</Text>
        <Aviso
          tipo="atencao"
          titulo="Sem internet"
          mensagem="Precisamos de conexão uma vez para baixar os dados da sua fazenda para este celular. O app continua sozinho assim que a rede voltar."
        />
        <Botao titulo="Sair da conta" variante="secundaria" onPress={() => void sair()} />
      </View>
    </SafeAreaView>
  );
}
