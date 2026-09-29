import { diasEntre, nomeDoMes, type DataISO } from '@/lib/datas';
import { formatarPrecoLitro, formatarReais } from '@/lib/dinheiro';

import { identificacao, type Animal } from './animal';
import type { AnaliseMes } from './analiseMes';
import { diasEmLactacao } from './lactacao';
import { vigencias, type PrecoLeite } from './precoLeite';

export type TipoSugestao =
  | 'sem_preco'
  | 'preco_desatualizado'
  | 'custo_acima_preco'
  | 'mes_prejuizo'
  | 'vaca_prejuizo'
  | 'vazia_del_alto'
  | 'custo_racao_subindo'
  | 'alimentacao_alta'
  | 'leite_descartado'
  | 'sem_despesas';

export type Sugestao = {
  tipo: TipoSugestao;
  /** `perigo` pede ação; `atencao` merece olhar; `info` é dica. */
  nivel: 'perigo' | 'atencao' | 'info';
  titulo: string;
  detalhe: string;
  animalId?: string;
};

/** Preço sem mudar há mais que isso merece conferência. */
export const DIAS_PRECO_DESATUALIZADO = 45;
/** Meses fechados seguidos no prejuízo para sugerir avaliar a vaca. */
export const MESES_PREJUIZO_VACA = 3;
export const DEL_VAZIA_ALTO = 150;
/** Alta do custo de alimentação por litro, mês contra mês, que vale alertar. */
export const ALTA_CUSTO_RACAO = 0.15;
/** Alimentação acima disso, em % das despesas, foge da referência (50–60%). */
export const ALIMENTACAO_ALTA = 70;
/** Leite descartado no mês acima disso (centavos) vira sugestão. */
export const DESCARTE_RELEVANTE = 5000;
/** Dia do mês a partir do qual a falta de despesas lançadas chama atenção. */
export const DIA_COBRAR_DESPESAS = 10;

const ORDEM_NIVEL = { perigo: 0, atencao: 1, info: 2 } as const;

const custoAlimentacaoPorLitro = (m: AnaliseMes) => {
  const litros = m.receita.litrosEntregues + m.receita.litrosDescartados;
  return litros > 0 && m.gastos.alimentacao > 0 ? m.gastos.alimentacao / 100 / litros : null;
};

/**
 * Sugestões de gestão a partir das análises mensais, do mais recente para o mais
 * antigo (`meses[0]` é o mês corrente). Regras simples e explicáveis.
 */
export function gerarSugestoes({
  hoje,
  meses,
  precos,
  animais,
}: {
  hoje: DataISO;
  meses: readonly AnaliseMes[];
  precos: readonly PrecoLeite[];
  animais: readonly Pick<Animal, 'id' | 'nome' | 'brinco' | 'sexo' | 'status' | 'resumo'>[];
}): Sugestao[] {
  const sugestoes: Sugestao[] = [];
  const add = (s: Sugestao) => sugestoes.push(s);
  const [atual, ...anteriores] = meses;
  const fechados = anteriores.filter((m) => m.fechado);
  const ultimoFechado = fechados[0];
  const porId = new Map(animais.map((a) => [a.id, a]));

  // Preço do leite.
  const ultimoPreco = vigencias(precos)[0];
  const temProducao = meses.some((m) => m.receita.litrosEntregues > 0);
  if (!ultimoPreco && temProducao) {
    add({
      tipo: 'sem_preco',
      nivel: 'perigo',
      titulo: 'Cadastre o preço do leite',
      detalhe: 'Sem ele não há receita, custo por litro nem margem das vacas.',
    });
  } else if (ultimoPreco && ultimoPreco.inicio <= hoje) {
    const dias = diasEntre(ultimoPreco.inicio, hoje);
    if (dias > DIAS_PRECO_DESATUALIZADO) {
      add({
        tipo: 'preco_desatualizado',
        nivel: 'info',
        titulo: `Preço do leite sem atualização há ${dias} dias`,
        detalhe: `Ainda é ${formatarPrecoLitro(ultimoPreco.valorLitro)}/L? Confira o último pagamento do laticínio.`,
      });
    }
  }

  // Custo por litro no mês corrente.
  const r = atual?.resultado;
  if (r && r.custoPorLitro !== null && r.precoMedio !== null && r.custoPorLitro > r.precoMedio) {
    add({
      tipo: 'custo_acima_preco',
      nivel: 'perigo',
      titulo: 'Custo por litro acima do preço do leite',
      detalhe: `${formatarPrecoLitro(r.custoPorLitro)} de custo contra ${formatarPrecoLitro(r.precoMedio)} recebidos por litro em ${nomeDoMes(atual.mes)}.`,
    });
  }

  if (ultimoFechado && ultimoFechado.resultado.resultado < 0 && ultimoFechado.gastos.total > 0) {
    add({
      tipo: 'mes_prejuizo',
      nivel: 'perigo',
      titulo: `${nomeDoMes(ultimoFechado.mes)} fechou no prejuízo`,
      detalhe: `Resultado de ${formatarReais(ultimoFechado.resultado.resultado)}: receita ${formatarReais(ultimoFechado.resultado.receita)}, despesas ${formatarReais(ultimoFechado.resultado.despesas)}.`,
    });
  }

  // Vacas em lactação no vermelho em todos os últimos meses fechados.
  const ultimos = fechados.slice(0, MESES_PREJUIZO_VACA);
  if (ultimos.length === MESES_PREJUIZO_VACA) {
    for (const animal of animais) {
      if (animal.status !== 'ativo' || animal.resumo.situacao !== 'lactacao') continue;
      const resultados = ultimos.map((m) => m.animais.find((a) => a.animalId === animal.id));
      const semprePrejuizo = resultados.every((x) => x && x.litros > 0 && x.margem < 0);
      if (!semprePrejuizo) continue;
      const soma = resultados.reduce((t, x) => t + (x?.margem ?? 0), 0);
      add({
        tipo: 'vaca_prejuizo',
        nivel: 'atencao',
        titulo: `${identificacao(animal)} deu prejuízo nos últimos ${MESES_PREJUIZO_VACA} meses`,
        detalhe: `Margem somada de ${formatarReais(soma)}. Avalie produção, saúde e descarte.`,
        animalId: animal.id,
      });
    }
  }

  // Vazias com DEL alto e margem abaixo da média das lactantes.
  if (ultimoFechado) {
    const lactantes = ultimoFechado.animais.filter(
      (x) => porId.get(x.animalId)?.resumo.situacao === 'lactacao' && x.litros > 0,
    );
    const media = lactantes.length
      ? lactantes.reduce((t, x) => t + x.margem, 0) / lactantes.length
      : null;
    for (const x of lactantes) {
      const animal = porId.get(x.animalId);
      if (!animal || animal.status !== 'ativo' || animal.resumo.prenhe || media === null) continue;
      const del = diasEmLactacao(animal.resumo, hoje) ?? 0;
      if (del > DEL_VAZIA_ALTO && x.margem < media) {
        add({
          tipo: 'vazia_del_alto',
          nivel: 'atencao',
          titulo: `${identificacao(animal)}: vazia com ${del} dias em lactação`,
          detalhe: `Margem de ${formatarReais(x.margem)} em ${nomeDoMes(ultimoFechado.mes)}, abaixo da média das vacas (${formatarReais(media)}). Priorize a inseminação ou avalie o descarte.`,
          animalId: animal.id,
        });
      }
    }
  }

  // Custo de alimentação por litro subindo (dois últimos meses fechados).
  if (fechados.length >= 2) {
    const agora = custoAlimentacaoPorLitro(fechados[0]);
    const antes = custoAlimentacaoPorLitro(fechados[1]);
    if (agora !== null && antes !== null && agora > antes * (1 + ALTA_CUSTO_RACAO)) {
      add({
        tipo: 'custo_racao_subindo',
        nivel: 'atencao',
        titulo: `Alimentação por litro subiu ${Math.round((agora / antes - 1) * 100)}%`,
        detalhe: `${formatarPrecoLitro(antes)} em ${nomeDoMes(fechados[1].mes)} para ${formatarPrecoLitro(agora)} em ${nomeDoMes(fechados[0].mes)}. Confira preço da ração e sobras no cocho.`,
      });
    }
  }

  const alimentacao = ultimoFechado?.resultado.percentualAlimentacao;
  if (ultimoFechado && alimentacao != null && alimentacao > ALIMENTACAO_ALTA) {
    add({
      tipo: 'alimentacao_alta',
      nivel: 'info',
      titulo: `Alimentação foi ${alimentacao}% das despesas`,
      detalhe: `A referência costuma ficar entre 50% e 60%. Vale rever a dieta e o custo da ração e do volumoso.`,
    });
  }

  // Leite descartado no mês corrente.
  if (atual && atual.receita.valorDescartado > DESCARTE_RELEVANTE) {
    const principais = [...atual.animais]
      .filter((x) => x.valorDescartado > 0)
      .sort((a, b) => b.valorDescartado - a.valorDescartado)
      .slice(0, 3)
      .flatMap((x) => {
        const a = porId.get(x.animalId);
        return a ? [identificacao(a)] : [];
      });
    add({
      tipo: 'leite_descartado',
      nivel: 'atencao',
      titulo: `${formatarReais(atual.receita.valorDescartado)} em leite descartado`,
      detalhe: `Em ${nomeDoMes(atual.mes)}${principais.length ? `, principalmente ${principais.join(', ')}` : ''}. Mastite e carência pesam no bolso.`,
    });
  }

  // Esqueceu de lançar as despesas?
  const diaDoMes = Number(hoje.slice(8, 10));
  if (
    atual &&
    atual.gastos.total === 0 &&
    diaDoMes >= DIA_COBRAR_DESPESAS &&
    anteriores.some((m) => m.gastos.total > 0)
  ) {
    add({
      tipo: 'sem_despesas',
      nivel: 'info',
      titulo: `Nenhuma despesa lançada em ${nomeDoMes(atual.mes)}`,
      detalhe: 'Sem as despesas, o resultado e a margem das vacas ficam otimistas demais.',
    });
  }

  return sugestoes.sort((a, b) => ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel]);
}
