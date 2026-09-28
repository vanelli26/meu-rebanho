import { Image } from 'expo-image';
import { Alert, ScrollView, Text, View } from 'react-native';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Botao, Card } from '@/components/ui';
import { haGravacoesPendentes, sair } from '@/features/conta';

function confirmarSaida() {
  const sairAgora = () => {
    sair().catch((erro: unknown) => console.error('[conta] Falha ao sair:', erro));
  };

  if (haGravacoesPendentes()) {
    Alert.alert(
      'Dados ainda não enviados',
      'Há registros que ainda não foram sincronizados com a internet. Se sair agora, eles podem se perder.\n\nConecte-se e espere o ícone "Pendente" sumir antes de sair.',
      [
        { text: 'Continuar no app', style: 'cancel' },
        { text: 'Sair mesmo assim', style: 'destructive', onPress: sairAgora },
      ],
    );
    return;
  }

  Alert.alert('Sair da conta?', 'Você vai precisar de internet para entrar de novo.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: sairAgora },
  ]);
}

export default function Mais() {
  const { conta, fazenda } = useSessaoPronta();

  return (
    <ScrollView contentContainerClassName="gap-4 p-4">
      <Card>
        <Text className="text-xl font-bold text-texto">Fazenda</Text>
        <Text className="text-lg text-texto">{fazenda.nome}</Text>
        <Text className="text-base text-texto-suave">
          {fazenda.municipio} – {fazenda.uf}
        </Text>
      </Card>

      <Card>
        <Text className="text-xl font-bold text-texto">Conta</Text>
        <View className="flex-row items-center gap-3">
          {conta.fotoUrl ? (
            <Image
              source={{ uri: conta.fotoUrl }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View className="flex-1">
            <Text className="text-lg font-semibold text-texto">{conta.nome}</Text>
            <Text className="text-base text-texto-suave">{conta.email}</Text>
          </View>
        </View>
        <Botao titulo="Sair" variante="perigo" onPress={confirmarSaida} />
      </Card>
    </ScrollView>
  );
}
