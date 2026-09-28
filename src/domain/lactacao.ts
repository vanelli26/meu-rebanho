import { diasEntre, type DataISO } from '@/lib/datas';

import type { ResumoAnimal } from './animal';
import type { ConfiguracoesFazenda } from './fazenda';

type ResumoLactacao = Pick<ResumoAnimal, 'situacao' | 'ultimoParto'>;

/** Dias em lactação (hoje − último parto). `null` se a vaca não está em lactação. */
export function diasEmLactacao(resumo: ResumoLactacao, hoje: DataISO): number | null {
  if (resumo.situacao !== 'lactacao' || !resumo.ultimoParto) return null;
  return Math.max(0, diasEntre(resumo.ultimoParto, hoje));
}

/** Em lactação, vazia e com DEL ≥ período voluntário de espera. */
export function liberadaParaInseminar(
  resumo: ResumoLactacao & Pick<ResumoAnimal, 'prenhe'>,
  hoje: DataISO,
  config: Pick<ConfiguracoesFazenda, 'periodoVoluntarioEspera'>,
): boolean {
  const del = diasEmLactacao(resumo, hoje);
  return del !== null && !resumo.prenhe && del >= config.periodoVoluntarioEspera;
}

/** Média dos intervalos entre partos (IEP), em dias. `null` sem ao menos dois partos. */
export function iepMedio(intervalos: readonly number[]): number | null {
  if (intervalos.length === 0) return null;
  return Math.round(intervalos.reduce((soma, dias) => soma + dias, 0) / intervalos.length);
}
