import { dataDeISO, somarDias, type DataISO } from '@/lib/datas';

import { gerarAlertas, ORDEM_ALERTAS, type Alerta, type TipoAlerta } from './alertas';
import { identificacao, type Animal } from './animal';
import type { ConfiguracoesFazenda } from './fazenda';

/** Dias à frente agendados de cada vez. Reagendados sempre que o app abre ou os dados mudam. */
export const DIAS_AGENDADOS = 7;

export const HORAS_LEMBRETE = [5, 6, 7, 8, 12, 17, 18, 19] as const;
export const HORA_PADRAO_LEMBRETE = 6;

export type Lembrete = { data: DataISO; quando: Date; titulo: string; corpo: string };

const ROTULO_CURTO: Record<TipoAlerta, string> = {
  carencia: 'Leite fora do tanque',
  parto: 'Parto',
  secagem: 'Secar',
  diagnostico: 'Diagnóstico',
  retorno_cio: 'Observar cio',
  sem_inseminacao: 'Inseminar',
};

/** Até quantos nomes por tipo antes de resumir como "e mais N". */
const NOMES_POR_TIPO = 3;

/** Texto da notificação: uma linha por tipo, do mais urgente ao menos. */
export function textoLembrete(alertas: readonly Alerta[]): { titulo: string; corpo: string } {
  const n = alertas.length;
  const titulo = `${n} ${n === 1 ? 'pendência' : 'pendências'} no rebanho hoje`;
  const linhas = ORDEM_ALERTAS.flatMap((tipo) => {
    const nomes = alertas.filter((a) => a.tipo === tipo).map(identificacao);
    if (!nomes.length) return [];
    const extra = nomes.length - NOMES_POR_TIPO;
    const lista = nomes.slice(0, NOMES_POR_TIPO).join(', ') + (extra > 0 ? ` e mais ${extra}` : '');
    return [`${ROTULO_CURTO[tipo]}: ${lista}`];
  });
  return { titulo, corpo: linhas.join('\n') };
}

/**
 * Lembretes dos próximos dias, calculados com os resumos de hoje. Dias sem
 * pendência não geram lembrete; o de hoje só entra se a hora ainda não passou.
 */
export function montarLembretes(
  animais: readonly Pick<Animal, 'id' | 'brinco' | 'nome' | 'sexo' | 'status' | 'resumo'>[],
  config: ConfiguracoesFazenda,
  agora: Date,
  hoje: DataISO,
  hora: number,
  dias = DIAS_AGENDADOS,
): Lembrete[] {
  return Array.from({ length: dias }, (_, i) => somarDias(hoje, i)).flatMap((data) => {
    const quando = dataDeISO(data);
    quando.setHours(hora, 0, 0, 0);
    if (quando <= agora) return [];
    const alertas = gerarAlertas(animais, config, data);
    return alertas.length ? [{ data, quando, ...textoLembrete(alertas) }] : [];
  });
}
