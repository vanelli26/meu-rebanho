import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { ESPACO_BARRA_ABAS } from '@/components/BarraAbas';
import { GraficoLitros } from '@/components/producao/GraficoLitros';
import { Botao, Card, Texto } from '@/components/ui';
import {
  ORDENHAS,
  resumoProducao,
  ROTULO_ORDENHA,
  serieDiaria,
  type ProducaoOrdenha,
} from '@/domain/producao';
import { useHoje } from '@/features/hoje';
import { useProducoes } from '@/features/producao';
import { dataDeISO, isoParaBR, type DataISO } from '@/lib/datas';
import { numeroParaTexto } from '@/lib/numeros';
import { useTema } from '@/lib/tema';

const DIAS_HISTORICO = 30;

export default function Producao() {
  const { fazenda } = useSessaoPronta();
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const hoje = useHoje();
  const { carregando, producoes } = useProducoes(fazenda.id, hoje, DIAS_HISTORICO);

  const resumo = useMemo(() => resumoProducao(producoes, hoje), [producoes, hoje]);
  const serie = useMemo(() => serieDiaria(producoes, hoje, DIAS_HISTORICO), [producoes, hoje]);
  const dias = useMemo(() => {
    const porDia = new Map<DataISO, ProducaoOrdenha[]>();
    for (const p of producoes) porDia.set(p.data, [...(porDia.get(p.data) ?? []), p]);
    return [...porDia.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [producoes]);
  const hojeLancado = producoes
    .filter((p) => p.data === hoje)
    .reduce((total, p) => total + p.totalLitros, 0);

  return (
    <ScrollView
      className="bg-fundo"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-4 px-4 pt-2"
      contentContainerStyle={{ paddingBottom: ESPACO_BARRA_ABAS + insets.bottom }}
    >
      <View>
        <Botao
          titulo="Lançar ordenha"
          icone="water"
          onPress={() => router.push('/producao/lancar')}
        />
      </View>

      <Card className="flex-row">
        <Numero valor={hojeLancado || null} rotulo="Hoje" />
        <Numero valor={resumo.ontem} rotulo="Ontem" separador />
        <Numero valor={resumo.media7Dias} rotulo="Média 7 dias" separador />
      </Card>

      {dias.length ? (
        <Card>
          <View className="flex-row items-baseline justify-between">
            <Texto variante="subtitulo">Leite no tanque</Texto>
            <Texto variante="legenda" tom="suave">
              últimos {DIAS_HISTORICO} dias
            </Texto>
          </View>
          <GraficoLitros serie={serie} />
        </Card>
      ) : null}

      <View className="gap-2">
        <Texto variante="subtitulo" className="px-1">
          Últimos {DIAS_HISTORICO} dias
        </Texto>
        {dias.length === 0 ? (
          <Card className="flex-row items-center gap-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primaria-suave">
              <Ionicons name="water-outline" size={22} color={cores.primaria} />
            </View>
            <Texto tom="suave" className="flex-1">
              {carregando ? 'Carregando…' : 'Nenhuma ordenha lançada ainda.'}
            </Texto>
          </Card>
        ) : (
          dias.map(([data, ordenhas]) => (
            <Card key={data} className="gap-2 p-4">
              <View className="flex-row items-baseline justify-between">
                <Texto variante="rotulo" className="text-[14px] capitalize">
                  {data === hoje
                    ? 'Hoje'
                    : format(dataDeISO(data), 'EEEE, dd/MM', { locale: ptBR })}
                </Texto>
                <Texto variante="rotulo" tom="primaria" className="text-[15px]">
                  {numeroParaTexto(ordenhas.reduce((t, o) => t + o.totalLitros, 0))} L
                </Texto>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {[...ordenhas]
                  .sort((a, b) => ORDENHAS.indexOf(a.ordenha) - ORDENHAS.indexOf(b.ordenha))
                  .map((o) => (
                    <Pressable
                      key={o.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ordenha da ${ROTULO_ORDENHA[o.ordenha]} de ${isoParaBR(o.data)}`}
                      onPress={() =>
                        router.push(`/producao/lancar?data=${o.data}&ordenha=${o.ordenha}`)
                      }
                      className="min-h-12 flex-row items-center gap-2 rounded-xl bg-superficie-2 px-3 active:opacity-70"
                    >
                      <Texto variante="legenda" tom="suave">
                        {ROTULO_ORDENHA[o.ordenha]}
                      </Texto>
                      <Texto variante="rotulo">{numeroParaTexto(o.totalLitros)} L</Texto>
                      {o.totalDescartado ? (
                        <Texto variante="legenda" tom="perigo">
                          +{numeroParaTexto(o.totalDescartado)} desc.
                        </Texto>
                      ) : null}
                      <Ionicons name="create-outline" size={14} color={cores.textoSuave} />
                    </Pressable>
                  ))}
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Numero({
  valor,
  rotulo,
  separador,
}: {
  valor: number | null;
  rotulo: string;
  separador?: boolean;
}) {
  return (
    <View className={`flex-1 gap-0.5 ${separador ? 'border-l border-borda pl-3' : ''}`}>
      <Texto variante="numero" tom="primaria" numberOfLines={1} adjustsFontSizeToFit>
        {valor === null ? '—' : `${numeroParaTexto(Math.round(valor))} L`}
      </Texto>
      <Texto variante="legenda" tom="suave">
        {rotulo}
      </Texto>
    </View>
  );
}
