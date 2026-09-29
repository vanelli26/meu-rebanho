import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';

/**
 * Pergunta antes de sair de um formulário com dados não salvos (voltar, gesto
 * ou botão do Android). Retorna `liberar`, a chamar logo antes de sair depois
 * de salvar, para não perguntar à toa.
 */
export function useConfirmarDescarte(alterado: boolean): () => void {
  const navigation = useNavigation();
  const liberado = useRef(false);

  usePreventRemove(alterado, ({ data }) => {
    if (liberado.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert('Descartar o que foi preenchido?', 'Os dados desta tela ainda não foram salvos.', [
      { text: 'Continuar aqui', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  return useCallback(() => {
    liberado.current = true;
  }, []);
}
