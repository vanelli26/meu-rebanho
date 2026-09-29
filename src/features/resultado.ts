import { useMemo } from 'react';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import {
  ratearDespesas,
  resultadoPorAnimal,
  type Rateio,
  type ResultadoAnimal,
} from '@/domain/rateio';
import { limitesDoMes, type MesISO } from '@/lib/datas';

import { useDadosFazenda } from './DadosFazendaProvider';
import { useFinanceiro } from './FinanceiroProvider';
import { useHoje } from './hoje';
import { useProducoesDesde } from './producao';

/** Rateio das despesas e resultado de cada animal no mês (até hoje, no mês corrente). */
export function useResultadoMes(mes: MesISO): {
  carregando: boolean;
  rateio: Rateio;
  resultados: ResultadoAnimal[];
} {
  const { fazenda } = useSessaoPronta();
  const { carregando: carregandoRebanho, animais, eventosPorAnimal } = useDadosFazenda();
  const { carregando: carregandoFinanceiro, despesas, precos } = useFinanceiro();
  const hoje = useHoje();
  const { inicio, fim: fimMes } = limitesDoMes(mes);
  const fim = fimMes < hoje ? fimMes : hoje;
  const { carregando: carregandoProducao, producoes } = useProducoesDesde(fazenda.id, inicio);

  return useMemo(() => {
    const rateio = ratearDespesas({ despesas, animais, eventosPorAnimal, producoes, inicio, fim });
    return {
      carregando: carregandoRebanho || carregandoFinanceiro || carregandoProducao,
      rateio,
      resultados: resultadoPorAnimal({ rateio, producoes, precos, inicio, fim }),
    };
  }, [
    despesas,
    animais,
    eventosPorAnimal,
    producoes,
    precos,
    inicio,
    fim,
    carregandoRebanho,
    carregandoFinanceiro,
    carregandoProducao,
  ]);
}
