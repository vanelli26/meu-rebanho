import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { Aviso, Card, Seletor, Texto } from '@/components/ui';
import { identificacao } from '@/domain/animal';
import { useDadosFazenda } from '@/features/DadosFazendaProvider';
import { useHoje } from '@/features/hoje';
import { useResultadoMes } from '@/features/resultado';
import { ehDataISO, mesDe } from '@/lib/datas';
import { formatarReais } from '@/lib/dinheiro';
import { numeroParaTexto } from '@/lib/numeros';
import { useTema } from '@/lib/tema';

type Ordem = 'pior' | 'melhor';

/** Receita, custo rateado e margem de cada animal no mês. */
export default function ResultadoAnimais() {
  const params = useLocalSearchParams<{ mes?: string }>();
  const { animalPorId } = useDadosFazenda();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const [mes, setMes] = useState(() =>
    params.mes && ehDataISO(`${params.mes}-01`) ? params.mes : mesDe(hoje),
  );
  const [ordem, setOrdem] = useState<Ordem>('pior');
  const { carregando, rateio, resultados } = useResultadoMes(mes);

  const lista = useMemo(
    () =>
      [...resultados].sort((a, b) =>
        ordem === 'pior' ? a.margem - b.margem : b.margem - a.margem,
      ),
    [resultados, ordem],
  );
  const noPrejuizo = resultados.filter((r) => r.margem < 0).length;

  return (
    <FlatList
      className="bg-fundo"
      data={lista}
      keyExtractor={(r) => r.animalId}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-2 px-4"
      contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
      ListHeaderComponent={
        <View className="gap-3 pb-2 pt-2">
          <SeletorMes mes={mes} aoMudar={setMes} mesAtual={mesDe(hoje)} />
          <Seletor
            opcoes={[
              { valor: 'pior', rotulo: 'Pior margem primeiro' },
              { valor: 'melhor', rotulo: 'Melhor primeiro' },
            ]}
            valor={ordem}
            aoMudar={setOrdem}
          />
          {noPrejuizo ? (
            <Aviso
              tipo="atencao"
              titulo={`${noPrejuizo} ${noPrejuizo === 1 ? 'animal' : 'animais'} com custo maior que a receita`}
              mensagem="Bezerras, novilhas e vacas secas não dão leite: o custo delas é investimento. Atenção às vacas em lactação no vermelho."
            />
          ) : null}
          {rateio.naoRateado > 0 ? (
            <Aviso
              titulo={`${formatarReais(rateio.naoRateado)} sem rateio`}
              mensagem="Despesas de um grupo sem nenhum animal no mês (ex.: vacas secas). Entram no resultado do mês, mas em nenhum animal."
            />
          ) : null}
        </View>
      }
      renderItem={({ item: r }) => {
        const animal = animalPorId.get(r.animalId);
        const negativa = r.margem < 0;
        return (
          <Pressable
            accessibilityRole="button"
            disabled={!animal}
            onPress={() => router.push(`/rebanho/${r.animalId}`, { withAnchor: true })}
            className="active:opacity-70"
          >
            <Card className="gap-2 p-4">
              <View className="flex-row items-center gap-2">
                <Texto variante="subtitulo" className="flex-1 text-[15px]" numberOfLines={1}>
                  {animal ? identificacao(animal) : '(excluído)'}
                </Texto>
                <Texto variante="subtitulo" tom={negativa ? 'perigo' : 'primaria'}>
                  {formatarReais(r.margem)}
                </Texto>
                <Ionicons name="chevron-forward" size={16} color={cores.textoSuave} />
              </View>
              <Texto variante="legenda" tom="suave">
                Receita {formatarReais(r.receita)} · custo {formatarReais(r.custo)}
                {r.litros ? ` · ${numeroParaTexto(r.litros)} L` : ''}
                {r.valorDescartado ? ` · ${formatarReais(r.valorDescartado)} descartados` : ''}
              </Texto>
            </Card>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        carregando ? null : (
          <Card>
            <Texto tom="suave">Sem produção nem despesas neste mês.</Texto>
          </Card>
        )
      }
    />
  );
}
