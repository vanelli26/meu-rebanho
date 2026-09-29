import { limitesDoMes, type DataISO, type MesISO } from '@/lib/datas';

import type { Animal } from './animal';
import {
  calcularResultadoMes,
  despesasDoPeriodo,
  resumirDespesas,
  type Despesa,
  type ResultadoMes,
  type ResumoDespesas,
} from './despesas';
import { calcularReceita, type PrecoLeite, type Receita } from './precoLeite';
import type { ProducaoOrdenha } from './producao';
import { ratearDespesas, resultadoPorAnimal, type Rateio, type ResultadoAnimal } from './rateio';
import type { EventoReprodutivo } from './reproducao';

export type DadosFinanceiros = {
  hoje: DataISO;
  animais: readonly Animal[];
  eventosPorAnimal: ReadonlyMap<string, readonly Pick<EventoReprodutivo, 'data' | 'tipo'>[]>;
  producoes: readonly ProducaoOrdenha[];
  precos: readonly PrecoLeite[];
  despesas: readonly Despesa[];
};

export type AnaliseMes = {
  mes: MesISO;
  inicio: DataISO;
  /** Último dia considerado: fim do mês, ou hoje no mês corrente. */
  fim: DataISO;
  /** O mês já terminou. */
  fechado: boolean;
  receita: Receita;
  gastos: ResumoDespesas;
  resultado: ResultadoMes;
  rateio: Rateio;
  animais: ResultadoAnimal[];
};

/** Tudo o que o financeiro calcula para um mês, a partir dos dados em cache. */
export function analisarMes(mes: MesISO, dados: DadosFinanceiros): AnaliseMes {
  const { inicio, fim: fimMes } = limitesDoMes(mes);
  const fechado = fimMes < dados.hoje;
  const fim = fechado ? fimMes : dados.hoje;
  const receita = calcularReceita(dados.producoes, dados.precos, inicio, fimMes);
  const gastos = resumirDespesas(despesasDoPeriodo(dados.despesas, inicio, fimMes));
  const rateio = ratearDespesas({
    despesas: dados.despesas,
    animais: dados.animais,
    eventosPorAnimal: dados.eventosPorAnimal,
    producoes: dados.producoes,
    inicio,
    fim,
    fimDespesas: fimMes,
  });
  return {
    mes,
    inicio,
    fim,
    fechado,
    receita,
    gastos,
    resultado: calcularResultadoMes({
      receita: receita.receita,
      litrosComPreco: receita.litrosEntregues - receita.litrosSemPreco,
      litrosProduzidos: receita.litrosEntregues + receita.litrosDescartados,
      despesas: gastos,
      inicio,
      fim: fimMes,
    }),
    rateio,
    animais: resultadoPorAnimal({
      rateio,
      producoes: dados.producoes,
      precos: dados.precos,
      inicio,
      fim,
    }),
  };
}
