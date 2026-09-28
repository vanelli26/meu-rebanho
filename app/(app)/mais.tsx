import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Avatar } from '@/components/Avatar';
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

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Texto variante="legenda" tom="suave" className="px-2 uppercase tracking-widest">
        {titulo}
      </Texto>
      <Card className="gap-0 overflow-hidden p-0">{children}</Card>
    </View>
  );
}

export default function Mais() {
  const { conta, fazenda } = useSessaoPronta();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      contentContainerClassName="gap-6 px-4 pt-2"
    >
      <Card className="flex-row items-center gap-4">
        <Avatar nome={conta.nome} fotoUrl={conta.fotoUrl} tamanho={60} />
        <View className="flex-1">
          <Texto variante="subtitulo">{conta.nome}</Texto>
          <Texto variante="legenda" tom="suave">
            {conta.email}
          </Texto>
        </View>
      </Card>

      <Grupo titulo="Fazenda">
        <LinhaMenu
          icone="home"
          titulo={fazenda.nome}
          detalhe={`${fazenda.municipio} – ${fazenda.uf}`}
        />
        <LinhaMenu
          icone="options"
          titulo="Prazos reprodutivos"
          detalhe={`Gestação ${fazenda.configuracoes.diasGestacao} dias · espera ${fazenda.configuracoes.periodoVoluntarioEspera} dias`}
          onPress={() => router.push('/prazos')}
          ultimo
        />
      </Grupo>

      <Grupo titulo="Ferramentas">
        <LinhaMenu
          icone="medkit"
          titulo="Tratamento em lote"
          detalhe="Vacinação, vermifugação..."
          cor="info"
          onPress={() => router.push('/tratamento')}
        />
        <LinhaMenu
          icone="share-outline"
          titulo="Exportar planilha"
          detalhe="Animais, produção, eventos e tratamentos"
          cor="info"
          onPress={() => router.push('/exportar')}
        />
        <LinhaMenu icone="notifications" titulo="Lembretes" cor="destaque" selo="Em breve" ultimo />
      </Grupo>

      <Grupo titulo="Conta">
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
