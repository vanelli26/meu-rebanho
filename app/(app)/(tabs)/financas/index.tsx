import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { ICONE_CATEGORIA } from '@/components/financas/estiloCategoria';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { Aviso, Botao, Card, Texto } from '@/components/ui';
import {
  calcularResultadoMes,
  despesasDoPeriodo,
  resumirDespesas,
  ROTULO_CATEGORIA,
  ROTULO_GRUPO,
} from '@/domain/despesas';
import { calcularReceita, precoNaData } from '@/domain/precoLeite';
import { useFinanceiro } from '@/features/FinanceiroProvider';
import { useHoje } from '@/features/hoje';
import { useProducoesDesde } from '@/features/producao';
import { isoParaBR, isoParaDiaMes, limitesDoMes, mesDe } from '@/lib/datas';
import { formatarPrecoLitro, formatarReais, formatarReaisCurto } from '@/lib/dinheiro';
import { numeroParaTexto } from '@/lib/numeros';
import { useTema } from '@/lib/tema';

export default function Financas() {
  const { fazenda } = useSessaoPronta();
  const { disponivel, carregando, precos, despesas } = useFinanceiro();
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
  const doMes = useMemo(() => despesasDoPeriodo(despesas, inicio, fim), [despesas, inicio, fim]);
  const gastos = useMemo(() => resumirDespesas(doMes), [doMes]);
  const r = calcularResultadoMes({
    receita: receita.receita,
    litrosComPreco: receita.litrosEntregues - receita.litrosSemPreco,
    litrosProduzidos: receita.litrosEntregues + receita.litrosDescartados,
    despesas: gastos,
    inicio,
    fim,
  });
  const vigente = precoNaData(precos, hoje);

  if (!disponivel) {
    return (
      <View className="flex-1 bg-fundo px-4 pt-32">
        <Aviso tipo="info" titulo="O financeiro é visível só para o dono da fazenda" />
      </View>
    );
  }

  const prejuizo = r.resultado < 0;
  const custoAcimaDoPreco =
    r.custoPorLitro !== null && r.precoMedio !== null && r.custoPorLitro > r.precoMedio;

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
          Resultado do mês
        </Texto>
        <Texto variante="display" tom={prejuizo ? 'perigo' : 'primaria'}>
          {formatarReaisCurto(r.resultado)}
        </Texto>
        <View className="flex-row">
          <Numero rotulo="Receita" valor={formatarReaisCurto(r.receita)} />
          <Numero rotulo="Despesas" valor={formatarReaisCurto(r.despesas)} separador />
        </View>
        <View className="flex-row border-t border-borda pt-3">
          <Numero
            rotulo="Custo por litro"
            valor={r.custoPorLitro !== null ? formatarPrecoLitro(r.custoPorLitro) : '—'}
            perigo={custoAcimaDoPreco}
          />
          <Numero
            rotulo="Preço médio"
            valor={r.precoMedio !== null ? formatarPrecoLitro(r.precoMedio) : '—'}
            separador
          />
        </View>
        {custoAcimaDoPreco ? (
          <Aviso
            tipo="perigo"
            titulo="Custo acima do preço do leite"
            mensagem={
              r.litrosDiaEquilibrio !== null
                ? `Para pagar as despesas do mês seriam precisos ${numeroParaTexto(r.litrosDiaEquilibrio)} L por dia no preço médio.`
                : undefined
            }
          />
        ) : null}
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/financas/animais?mes=${mes}`)}
        className="active:opacity-70"
      >
        <Card className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primaria-suave">
            <Ionicons name="podium-outline" size={20} color={cores.primaria} />
          </View>
          <View className="flex-1">
            <Texto variante="subtitulo">Resultado por animal</Texto>
            <Texto variante="legenda" tom="suave">
              Receita, custo rateado e margem de cada vaca
            </Texto>
          </View>
          <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
        </Card>
      </Pressable>

      <Botao
        titulo="Lançar despesa"
        icone="add-circle"
        onPress={() => router.push('/financas/despesa')}
      />

      <Card>
        <View className="flex-row items-baseline justify-between">
          <Texto variante="subtitulo">Receita com leite</Texto>
          <Texto variante="rotulo" tom="primaria">
            {formatarReais(receita.receita)}
          </Texto>
        </View>
        <Texto variante="legenda" tom="suave">
          {numeroParaTexto(receita.litrosEntregues)} L entregues
          {receita.valorDescartado > 0
            ? ` · ${formatarReais(receita.valorDescartado)} em leite descartado (${numeroParaTexto(receita.litrosDescartados)} L)`
            : ''}
        </Texto>
        {receita.litrosSemPreco > 0 && !carregando ? (
          <Aviso
            tipo="atencao"
            titulo={`${numeroParaTexto(receita.litrosSemPreco)} L sem preço`}
            mensagem="Há ordenhas antes do primeiro preço cadastrado. Cadastre o preço com a data de início certa para entrarem na receita."
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(vigente ? '/financas/precos' : '/financas/preco')}
          className="min-h-12 flex-row items-center gap-3 rounded-2xl bg-superficie-2 px-4 active:opacity-70"
        >
          <Ionicons name="pricetag-outline" size={18} color={cores.primaria} />
          <Texto variante="rotulo" className="flex-1 text-[14px]">
            {vigente
              ? `Preço hoje: ${formatarPrecoLitro(vigente.valorLitro)}/L desde ${isoParaBR(vigente.inicio)}`
              : carregando
                ? 'Carregando…'
                : 'Cadastrar o preço do leite'}
          </Texto>
          <Ionicons name="chevron-forward" size={16} color={cores.textoSuave} />
        </Pressable>
      </Card>

      {gastos.porCategoria.length ? (
        <Card>
          <View className="flex-row items-baseline justify-between">
            <Texto variante="subtitulo">Despesas por categoria</Texto>
            {r.percentualAlimentacao !== null ? (
              <Texto variante="legenda" tom="suave">
                {r.percentualAlimentacao}% alimentação
              </Texto>
            ) : null}
          </View>
          {gastos.porCategoria.map(({ categoria, valor }) => (
            <View key={categoria} className="gap-1">
              <View className="flex-row items-center gap-2">
                <Ionicons name={ICONE_CATEGORIA[categoria]} size={16} color={cores.primaria} />
                <Texto variante="rotulo" className="flex-1 text-[14px]">
                  {ROTULO_CATEGORIA[categoria]}
                </Texto>
                <Texto variante="rotulo" className="text-[14px]">
                  {formatarReais(valor)}
                </Texto>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-superficie-2">
                <View
                  className="h-2 rounded-full bg-primaria"
                  style={{ width: `${Math.max(2, (valor / gastos.total) * 100)}%` }}
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <View className="gap-2">
        <Texto variante="subtitulo" className="px-1">
          Lançamentos do mês
        </Texto>
        {doMes.length ? (
          <Card className="gap-0 p-0">
            {doMes.map((d, i) => (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                onPress={() => router.push(`/financas/despesa?id=${d.id}`)}
                className={`min-h-16 flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${
                  i ? 'border-t border-borda' : ''
                }`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primaria-suave">
                  <Ionicons name={ICONE_CATEGORIA[d.categoria]} size={18} color={cores.primaria} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Texto variante="rotulo" className="text-[14px]" numberOfLines={1}>
                    {d.descricao || ROTULO_CATEGORIA[d.categoria]}
                  </Texto>
                  <Texto variante="legenda" tom="suave" numberOfLines={1}>
                    {isoParaDiaMes(d.data)} ·{' '}
                    {d.grupo === 'animais'
                      ? `${d.animalIds.length} ${d.animalIds.length === 1 ? 'animal' : 'animais'}`
                      : ROTULO_GRUPO[d.grupo]}
                  </Texto>
                </View>
                <Texto variante="rotulo" className="text-[14px]">
                  {formatarReais(d.valor)}
                </Texto>
              </Pressable>
            ))}
          </Card>
        ) : (
          <Card>
            <Texto tom="suave">
              {carregando ? 'Carregando…' : 'Nenhuma despesa lançada neste mês.'}
            </Texto>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function Numero({
  rotulo,
  valor,
  separador,
  perigo,
}: {
  rotulo: string;
  valor: string;
  separador?: boolean;
  perigo?: boolean;
}) {
  return (
    <View className={`flex-1 gap-0.5 ${separador ? 'border-l border-borda pl-3' : ''}`}>
      <Texto variante="subtitulo" tom={perigo ? 'perigo' : 'normal'} numberOfLines={1}>
        {valor}
      </Texto>
      <Texto variante="legenda" tom="suave">
        {rotulo}
      </Texto>
    </View>
  );
}
