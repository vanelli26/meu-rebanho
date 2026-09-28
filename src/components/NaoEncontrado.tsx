import { router } from 'expo-router';
import { View } from 'react-native';

import { Aviso, Botao } from './ui';

/** Animal ou registro que não existe (apagado ou link antigo). */
export function NaoEncontrado({ mensagem }: { mensagem?: string }) {
  return (
    <View className="flex-1 gap-4 bg-fundo p-4">
      <Aviso
        tipo="atencao"
        titulo="Não encontrado"
        mensagem={mensagem ?? 'Este animal não está mais no rebanho ou ainda não foi baixado.'}
      />
      <Botao
        titulo="Voltar"
        variante="secundaria"
        icone="arrow-back"
        onPress={() => router.back()}
      />
    </View>
  );
}
