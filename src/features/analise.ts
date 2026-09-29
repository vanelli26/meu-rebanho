import { useMemo } from 'react';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import { analisarMes, type AnaliseMes, type DadosFinanceiros } from '@/domain/analiseMes';
import { gerarSugestoes, type Sugestao } from '@/domain/sugestoes';
import { limitesDoMes, mesDe, somarMeses, type MesISO } from '@/lib/datas';

import { useDadosFazenda } from './DadosFazendaProvider';
import { useFinanceiro } from './FinanceiroProvider';
import { useHoje } from './hoje';
import { useProducoesDesde } from './producao';

/** Meses analisados para as sugestões: o corrente e os 3 anteriores. */
const MESES_SUGESTOES = 4;

function useDadosFinanceiros(desde: MesISO): { carregando: boolean; dados: DadosFinanceiros } {
  const { fazenda } = useSessaoPronta();
  const rebanho = useDadosFazenda();
  const financeiro = useFinanceiro();
  const hoje = useHoje();
  const { carregando, producoes } = useProducoesDesde(fazenda.id, limitesDoMes(desde).inicio);
  return useMemo(
    () => ({
      carregando: rebanho.carregando || financeiro.carregando || carregando,
      dados: {
        hoje,
        animais: rebanho.animais,
        eventosPorAnimal: rebanho.eventosPorAnimal,
        producoes,
        precos: financeiro.precos,
        despesas: financeiro.despesas,
      },
    }),
    [rebanho, financeiro, carregando, producoes, hoje],
  );
}

/** Receita, despesas, rateio e resultado por animal de um mês. */
export function useAnaliseMes(mes: MesISO): { carregando: boolean; analise: AnaliseMes } {
  const { carregando, dados } = useDadosFinanceiros(mes);
  return useMemo(
    () => ({ carregando, analise: analisarMes(mes, dados) }),
    [carregando, dados, mes],
  );
}

/** Sugestões de gestão com o mês corrente e os anteriores. Vazia para quem não é dono. */
export function useSugestoes(): { carregando: boolean; sugestoes: Sugestao[] } {
  const { disponivel } = useFinanceiro();
  const hoje = useHoje();
  const atual = mesDe(hoje);
  const { carregando, dados } = useDadosFinanceiros(somarMeses(atual, 1 - MESES_SUGESTOES));
  return useMemo(() => {
    if (!disponivel || carregando) return { carregando, sugestoes: [] };
    const meses = Array.from({ length: MESES_SUGESTOES }, (_, i) =>
      analisarMes(somarMeses(atual, -i), dados),
    );
    return {
      carregando,
      sugestoes: gerarSugestoes({ hoje, meses, precos: dados.precos, animais: dados.animais }),
    };
  }, [disponivel, carregando, dados, atual, hoje]);
}
