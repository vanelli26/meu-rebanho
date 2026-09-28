import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import type { PontoSerie } from '@/domain/producao';
import { dataDeISO, isoParaDiaMes } from '@/lib/datas';
import { numeroParaTexto } from '@/lib/numeros';
import { fontes, useTema } from '@/lib/tema';

import { Texto } from '../ui/Texto';

type Props = { serie: readonly PontoSerie[]; altura?: number };

const LARGURA_EIXO_Y = 34;

/**
 * Barras de litros por dia, sem animação. Toque numa barra para ver o dia.
 * Dias sem lançamento ficam sem barra (não confundir com produção zero).
 */
export function GraficoLitros({ serie, altura = 150 }: Props) {
  const { cores } = useTema();
  const [largura, setLargura] = useState(0);
  const [escolhido, setEscolhido] = useState<number | null>(null);

  const n = serie.length;
  const util = Math.max(0, largura - LARGURA_EIXO_Y - 8);
  const passo = n ? util / n : 0;
  const barra = Math.max(3, Math.floor(passo * 0.65));
  const espaco = Math.max(1, passo - barra);

  const ponto = escolhido !== null ? serie[escolhido] : null;
  const comDados = serie.filter((p) => p.litros !== null);
  const media = comDados.length
    ? comDados.reduce((t, p) => t + (p.litros ?? 0), 0) / comDados.length
    : null;

  return (
    <View className="gap-2" onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      <Texto variante="legenda" tom="suave">
        {ponto
          ? `${format(dataDeISO(ponto.data), 'EEEE, dd/MM', { locale: ptBR })}: ${
              ponto.litros === null ? 'sem lançamento' : `${numeroParaTexto(ponto.litros)} L`
            }`
          : media !== null
            ? `Média de ${numeroParaTexto(Math.round(media * 10) / 10)} L nos dias lançados · toque numa barra`
            : 'Nenhum lançamento no período'}
      </Texto>
      {largura > 0 ? (
        <BarChart
          data={serie.map((p, i) => ({
            value: p.litros ?? 0,
            frontColor: i === escolhido ? cores.destaque : cores.primaria,
            onPress: () => setEscolhido(i === escolhido ? null : i),
          }))}
          width={util}
          height={altura}
          barWidth={barra}
          spacing={espaco}
          initialSpacing={espaco / 2}
          endSpacing={0}
          barBorderTopLeftRadius={Math.min(3, barra / 2)}
          barBorderTopRightRadius={Math.min(3, barra / 2)}
          noOfSections={3}
          yAxisLabelWidth={LARGURA_EIXO_Y}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={cores.borda}
          rulesColor={cores.borda}
          rulesType="solid"
          yAxisTextStyle={{ color: cores.textoSuave, fontFamily: fontes.medio, fontSize: 10 }}
          xAxisLabelsHeight={0}
          disableScroll
          isAnimated={false}
        />
      ) : (
        <View style={{ height: altura + 10 }} />
      )}
      {n ? (
        // Datas das pontas em vez de rótulos por barra (não cabem em 30 dias).
        <View className="flex-row justify-between" style={{ paddingLeft: LARGURA_EIXO_Y }}>
          <Texto variante="legenda" tom="suave">
            {isoParaDiaMes(serie[0].data)}
          </Texto>
          <Texto variante="legenda" tom="suave">
            {isoParaDiaMes(serie[n - 1].data)}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
