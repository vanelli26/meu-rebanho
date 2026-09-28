import type { ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Avatar } from '@/components/Avatar';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { LinhaMenu } from '@/components/LinhaMenu';
import { Card, Texto } from '@/components/ui';
import { haGravacoesPendentes, sair } from '@/features/conta';

function confirmarSaida() {
  const sairAgora = () => {
    sair().catch((erro: unknown) => console.error('[conta] Falha ao sair:', erro));
  };

  if (haGravacoesPendentes()) {
    Alert.alert(
      'Dados ainda não enviados',
      'Há registros que ainda não foram sincronizados com a internet. Se sair agora, eles podem se perder.\n\nConecte-se e espere o aviso "Sincronizando" sumir antes de sair.',
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

function Grupo({
  titulo,
  indice,
  children,
}: {
  titulo: string;
  indice: number;
  children: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(60 * indice)
        .springify()
        .damping(18)}
      className="gap-2"
    >
      <Texto variante="legenda" tom="suave" className="px-2 uppercase tracking-widest">
        {titulo}
      </Texto>
      <Card className="gap-0 overflow-hidden p-0">{children}</Card>
    </Animated.View>
  );
}

export default function Mais() {
  const { conta, fazenda } = useSessaoPronta();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="bg-fundo"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: ESPACO_BARRA_ABAS + insets.bottom,
      }}
      contentContainerClassName="gap-6 px-4"
    >
      <Texto variante="display" className="px-1">
        Mais
      </Texto>

      <Card indice={0} className="flex-row items-center gap-4">
        <Avatar nome={conta.nome} fotoUrl={conta.fotoUrl} tamanho={60} />
        <View className="flex-1">
          <Texto variante="subtitulo">{conta.nome}</Texto>
          <Texto variante="legenda" tom="suave">
            {conta.email}
          </Texto>
        </View>
      </Card>

      <Grupo titulo="Fazenda" indice={1}>
        <LinhaMenu
          icone="home"
          titulo={fazenda.nome}
          detalhe={`${fazenda.municipio} – ${fazenda.uf}`}
        />
        <LinhaMenu icone="options" titulo="Prazos reprodutivos" selo="Em breve" ultimo />
      </Grupo>

      <Grupo titulo="Ferramentas" indice={2}>
        <LinhaMenu icone="medkit" titulo="Sanidade" cor="info" selo="Em breve" />
        <LinhaMenu icone="share-outline" titulo="Exportar planilha" cor="info" selo="Em breve" />
        <LinhaMenu icone="notifications" titulo="Lembretes" cor="destaque" selo="Em breve" ultimo />
      </Grupo>

      <Grupo titulo="Conta" indice={3}>
        <LinhaMenu
          icone="log-out-outline"
          titulo="Sair"
          cor="perigo"
          onPress={confirmarSaida}
          ultimo
        />
      </Grupo>

      <Texto variante="legenda" tom="suave" className="text-center">
        Meu Rebanho · versão 1.0.0
      </Texto>
    </ScrollView>
  );
}
