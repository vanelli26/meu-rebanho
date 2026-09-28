import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { Botao, Card, Seletor, Texto } from '@/components/ui';
import {
  csvAnimais,
  csvEventos,
  csvProducao,
  csvTratamentos,
  nomeArquivo,
  type TipoExportacao,
} from '@/domain/exportacao';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { compartilharCSV } from '@/features/exportacao';
import { useHoje } from '@/features/hoje';
import { useProducoes } from '@/features/producao';
import { useTema } from '@/lib/tema';

const PERIODOS = [
  { valor: '30', rotulo: '30 dias' },
  { valor: '90', rotulo: '90 dias' },
  { valor: '365', rotulo: '1 ano' },
] as const;

type Periodo = (typeof PERIODOS)[number]['valor'];

export default function Exportar() {
  const { fazenda } = useSessaoPronta();
  const { animais, animalPorId, eventosPorAnimal, tratamentosPorAnimal } = useDadosFazenda();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [periodo, setPeriodo] = useState<Periodo>('30');
  const { carregando, producoes } = useProducoes(fazenda.id, hoje, Number(periodo));
  const [gerando, setGerando] = useState<TipoExportacao | null>(null);

  const eventos = [...eventosPorAnimal.values()].flat();
  const tratamentos = [...tratamentosPorAnimal.values()].flat();

  const compartilhar = (tipo: TipoExportacao, gerar: () => string) => {
    setGerando(tipo);
    compartilharCSV(nomeArquivo(tipo, hoje), gerar())
      .catch((erro: unknown) => {
        console.error('[exportação] Falha ao compartilhar:', erro);
        Alert.alert('Não foi possível compartilhar', 'Tente de novo em instantes.');
      })
      .finally(() => setGerando(null));
  };

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <Texto tom="suave" className="px-1">
        Planilhas CSV para abrir no Excel ou no Google Planilhas, ou mandar pelo WhatsApp. Sem
        internet, levam o que já está salvo no aparelho.
      </Texto>

      <Item
        icone="paw"
        titulo="Animais"
        detalhe={`${animais.length} cadastrados, com situação e previsões`}
        gerando={gerando === 'animais'}
        desativado={!animais.length}
        onPress={() => compartilhar('animais', () => csvAnimais(animais))}
      />

      <Item
        icone="water"
        titulo="Produção"
        detalhe={
          carregando
            ? 'Carregando…'
            : `${producoes.length} ${producoes.length === 1 ? 'ordenha' : 'ordenhas'}, litros por vaca`
        }
        gerando={gerando === 'producao'}
        desativado={carregando || !producoes.length}
        onPress={() => compartilhar('producao', () => csvProducao(producoes, animalPorId))}
      >
        <Seletor opcoes={PERIODOS} valor={periodo} aoMudar={setPeriodo} />
      </Item>

      <Item
        icone="heart"
        titulo="Eventos reprodutivos"
        detalhe={`${eventos.length} ${eventos.length === 1 ? 'evento' : 'eventos'}`}
        gerando={gerando === 'eventos'}
        desativado={!eventos.length}
        onPress={() => compartilhar('eventos', () => csvEventos(eventos, animalPorId))}
      />

      <Item
        icone="medkit"
        titulo="Tratamentos"
        detalhe={`${tratamentos.length} ${tratamentos.length === 1 ? 'tratamento' : 'tratamentos'}, com carências`}
        gerando={gerando === 'tratamentos'}
        desativado={!tratamentos.length}
        onPress={() => compartilhar('tratamentos', () => csvTratamentos(tratamentos, animalPorId))}
      />
    </ScrollView>
  );
}

function Item({
  icone,
  titulo,
  detalhe,
  gerando,
  desativado,
  onPress,
  children,
}: {
  icone: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  detalhe: string;
  gerando: boolean;
  desativado: boolean;
  onPress: () => void;
  children?: ReactNode;
}) {
  const { cores } = useTema();
  return (
    <Card>
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-primaria-suave">
          <Ionicons name={icone} size={20} color={cores.primaria} />
        </View>
        <View className="flex-1">
          <Texto variante="subtitulo">{titulo}</Texto>
          <Texto variante="legenda" tom="suave">
            {detalhe}
          </Texto>
        </View>
      </View>
      {children}
      <Botao
        titulo="Compartilhar planilha"
        icone="share-outline"
        variante="secundaria"
        onPress={onPress}
        carregando={gerando}
        disabled={desativado}
      />
    </Card>
  );
}
