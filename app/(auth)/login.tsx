import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { entrarComGoogle } from '@/auth/google';
import { Aviso, Botao } from '@/components/ui';

export default function Login() {
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O login precisa do servidor, então aqui aguardar é correto.
  const entrar = async () => {
    setEntrando(true);
    setErro(null);
    const resultado = await entrarComGoogle();
    if (!resultado.ok) {
      setErro(resultado.mensagem);
      setEntrando(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-fundo">
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="items-center gap-3">
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 112, height: 112, borderRadius: 24 }}
            accessibilityIgnoresInvertColors
          />
          <Text className="text-2xl font-bold text-texto">Meu Rebanho</Text>
          <Text className="text-center text-lg text-texto-suave">
            Gestão do gado leiteiro no curral, mesmo sem internet.
          </Text>
        </View>

        <View className="gap-4">
          <Botao titulo="Entrar com Google" onPress={entrar} carregando={entrando} />
          {erro ? <Aviso tipo="perigo" titulo={erro} /> : null}
          <Aviso
            tipo="info"
            titulo="Primeiro acesso precisa de internet"
            mensagem="Depois de entrar, o app funciona offline e sincroniza sozinho."
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
