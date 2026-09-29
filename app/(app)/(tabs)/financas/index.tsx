import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { Aviso, Botao, Card, Texto } from '@/components/ui';
import { calcularReceita, precoNaData } from '@/domain/precoLeite';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { useProducoesDesde } from '@/features/producao';
import { isoParaBR, limitesDoMes, mesDe } from '@/lib/datas';
import { formatarPrecoLitro, formatarReais, formatarReaisCurto } from '@/lib/dinheiro';
import { numeroParaTexto } from '@/lib/numeros';
import { useTema } from '@/lib/tema';

export default function Financas() {
  const { fazenda } = useSessaoPronta();
  const { disponivel, carregando, precos } = useFinanceiro();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [mes, setMes] = useState(() => mesDe(hoje));
  const { inicio, fim } = limitesDoMes(mes);
  const { producoes } = useProducoesDesde(fazenda.id, inicio);

  const receita = useMemo(
    () => calcularReceita(producoes, precos, inicio, fim),
    [producoes, precos, inicio, fim],
  );
  const vigente = precoNaData(precos, hoje);
  const precoMedio =
    receita.litrosEntregues - receita.litrosSemPreco
      ? receita.receita / 100 / (receita.litrosEntregues - receita.litrosSemPreco)
      : null;

  if (!disponivel) {
    return (
      <View className="flex-1 bg-fundo px-4 pt-32">
        <Aviso tipo="info" titulo="O financeiro é visível só para o dono da fazenda" />
      </View>
    );
  }

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
    >
      <SeletorMes mes={mes} aoMudar={setMes} mesAtual={mesDe(hoje)} />

      <Card>
        <Texto variante="legenda" tom="suave">
          Receita com leite
        </Texto>
        <Texto variante="display" tom="primaria">
          {formatarReaisCurto(receita.receita)}
        </Texto>
        <Texto variante="legenda" tom="suave">
          {numeroParaTexto(receita.litrosEntregues)} L entregues
          {precoMedio !== null ? ` · média de ${formatarPrecoLitro(precoMedio)}/L` : ''}
        </Texto>
        {receita.litrosSemPreco > 0 && !carregando ? (
          <Aviso
            tipo="atencao"
            titulo={`${numeroParaTexto(receita.litrosSemPreco)} L sem preço`}
            mensagem="Há ordenhas antes do primeiro preço cadastrado. Cadastre o preço com a data de início certa para entrarem na receita."
          />
        ) : null}
      </Card>

      {receita.valorDescartado > 0 ? (
        <Card className="flex-row items-center gap-3">
          <Icone nome="trash-outline" cor="perigo" fundo="bg-perigo-suave" />
          <View className="flex-1">
            <Texto variante="subtitulo" tom="perigo">
              {formatarReais(receita.valorDescartado)} descartados
            </Texto>
            <Texto variante="legenda" tom="suave">
              {numeroParaTexto(receita.litrosDescartados)} L fora do tanque (carência, mastite...)
            </Texto>
          </View>
        </Card>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/financas/precos')}
        className="active:opacity-70"
      >
        <Card className="flex-row items-center gap-3">
          <Icone nome="pricetag-outline" cor="primaria" fundo="bg-primaria-suave" />
          <View className="flex-1">
            <Texto variante="legenda" tom="suave">
              Preço do leite hoje
            </Texto>
            {vigente ? (
              <>
                <Texto variante="subtitulo">
                  {formatarPrecoLitro(vigente.valorLitro)} por litro
                </Texto>
                <Texto variante="legenda" tom="suave">
                  Desde {isoParaBR(vigente.inicio)}
                </Texto>
              </>
            ) : (
              <Texto variante="subtitulo" tom="atencao">
                {carregando ? 'Carregando…' : 'Nenhum preço cadastrado'}
              </Texto>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
        </Card>
      </Pressable>

      {!vigente && !carregando ? (
        <Botao
          titulo="Cadastrar preço do leite"
          icone="add-circle"
          onPress={() => router.push('/financas/preco')}
        />
      ) : null}
    </ScrollView>
  );
}

function Icone({
  nome,
  cor,
  fundo,
}: {
  nome: ComponentProps<typeof Ionicons>['name'];
  cor: 'primaria' | 'perigo';
  fundo: string;
}) {
  const { cores } = useTema();
  return (
    <View className={`h-11 w-11 items-center justify-center rounded-full ${fundo}`}>
      <Ionicons name={nome} size={20} color={cores[cor]} />
    </View>
  );
}
