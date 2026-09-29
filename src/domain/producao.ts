import { z } from 'zod';

import { diasEntre, ehDataISO, somarDias, type DataISO } from '@/lib/datas';

export type Ordenha = 'manha' | 'tarde' | 'unica';

export const ORDENHAS: readonly Ordenha[] = ['manha', 'tarde', 'unica'];

export const ROTULO_ORDENHA: Record<Ordenha, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  unica: 'Única',
};

export type RegistroProducao = { litros: number; descartado: boolean };

/** `producao/{data_ordenha}`, com o id do documento. */
export type ProducaoOrdenha = {
  id: string;
  data: DataISO;
  ordenha: Ordenha;
  registros: Record<string, RegistroProducao>;
  /** Litros que foram para o tanque (exclui descartados). */
  totalLitros: number;
  /** Litros descartados (carência, mastite...). */
  totalDescartado: number;
};

/** ID do documento da ordenha, ex.: `2026-09-27_manha`. */
export function idOrdenha(data: DataISO, ordenha: Ordenha): string {
  return `${data}_${ordenha}`;
}

/** Arredonda para 0,1 L e evita somas como 12.299999. */
const arredondar = (litros: number) => Math.round(litros * 10) / 10;

/**
 * Monta o documento da ordenha. Ignora vacas sem litros informados ou com zero.
 * Os totais são calculados aqui para não precisar de agregação no servidor.
 */
export function montarProducao(
  data: DataISO,
  ordenha: Ordenha,
  lancamentos: Record<string, { litros: number | null; descartado: boolean }>,
): Omit<ProducaoOrdenha, 'id'> {
  const registros: Record<string, RegistroProducao> = {};
  let totalLitros = 0;
  let totalDescartado = 0;

  for (const [animalId, { litros, descartado }] of Object.entries(lancamentos)) {
    if (litros === null || !(litros > 0)) continue;
    const valor = arredondar(litros);
    registros[animalId] = { litros: valor, descartado };
    if (descartado) totalDescartado += valor;
    else totalLitros += valor;
  }

  return {
    data,
    ordenha,
    registros,
    totalLitros: arredondar(totalLitros),
    totalDescartado: arredondar(totalDescartado),
  };
}

/** Litros entregues por dia (somando as ordenhas), só para os dias com registro. */
export function entreguePorDia(
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'totalLitros'>[],
): Map<DataISO, number> {
  const porDia = new Map<DataISO, number>();
  for (const p of producoes) {
    porDia.set(p.data, arredondar((porDia.get(p.data) ?? 0) + p.totalLitros));
  }
  return porDia;
}

export type ResumoProducao = {
  /** Litros entregues ontem, ou `null` se não houve lançamento. */
  ontem: number | null;
  /** Média diária dos últimos 7 dias (até ontem) que tiveram lançamento. */
  media7Dias: number | null;
};

export function resumoProducao(
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'totalLitros'>[],
  hoje: DataISO,
): ResumoProducao {
  const porDia = entreguePorDia(producoes);
  const ultimos = [...porDia.entries()].filter(([data]) => {
    const dias = diasEntre(data, hoje);
    return dias >= 1 && dias <= 7;
  });
  const soma = ultimos.reduce((total, [, litros]) => total + litros, 0);
  return {
    ontem: porDia.get(somarDias(hoje, -1)) ?? null,
    media7Dias: ultimos.length ? arredondar(soma / ultimos.length) : null,
  };
}

/** Produção de uma vaca em cada ordenha, do mais recente para o mais antigo. */
export function producaoDoAnimal(
  producoes: readonly ProducaoOrdenha[],
  animalId: string,
): { data: DataISO; ordenha: Ordenha; litros: number; descartado: boolean }[] {
  return producoes
    .filter((p) => p.registros[animalId])
    .map((p) => ({ data: p.data, ordenha: p.ordenha, ...p.registros[animalId] }))
    .sort(
      (a, b) =>
        b.data.localeCompare(a.data) || ORDENHAS.indexOf(b.ordenha) - ORDENHAS.indexOf(a.ordenha),
    );
}

export type PontoSerie = { data: DataISO; litros: number | null };

/**
 * Litros por dia nos últimos `dias` dias (até hoje), do mais antigo ao mais novo.
 * Sem `animalId`: o que foi para o tanque. Com `animalId`: tudo o que a vaca deu
 * (inclusive descartado). Dia sem lançamento fica `null`.
 */
export function serieDiaria(
  producoes: readonly ProducaoOrdenha[],
  hoje: DataISO,
  dias: number,
  animalId?: string,
): PontoSerie[] {
  const porDia = new Map<DataISO, number>();
  for (const p of producoes) {
    const litros = animalId ? p.registros[animalId]?.litros : p.totalLitros;
    if (litros === undefined) continue;
    porDia.set(p.data, arredondar((porDia.get(p.data) ?? 0) + litros));
  }
  return Array.from({ length: dias }, (_, i) => {
    const data = somarDias(hoje, i - dias + 1);
    return { data, litros: porDia.get(data) ?? null };
  });
}

/**
 * Litros de cada vaca na ordenha anterior do mesmo turno (até 7 dias antes), para
 * servir de referência ao digitar. Vaca sem registro nesse período fica de fora.
 */
export function litrosOrdenhaAnterior(
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'ordenha' | 'registros'>[],
  data: DataISO,
  ordenha: Ordenha,
): Record<string, number> {
  const limite = somarDias(data, -7);
  const anteriores = producoes
    .filter((p) => p.ordenha === ordenha && p.data < data && p.data >= limite)
    .sort((a, b) => b.data.localeCompare(a.data));
  const litros: Record<string, number> = {};
  for (const p of anteriores) {
    for (const [id, r] of Object.entries(p.registros)) {
      if (!(id in litros)) litros[id] = r.litros;
    }
  }
  return litros;
}

/** Sugere a ordenha pela hora: antes do meio-dia, manhã; depois, tarde. */
export function ordenhaSugerida(hora: number): Ordenha {
  return hora < 12 ? 'manha' : 'tarde';
}

export const esquemaCabecalhoProducao = z.object({
  data: z
    .string()
    .nullable()
    .refine((v): v is string => v !== null && ehDataISO(v), 'Informe uma data válida.'),
  ordenha: z.enum(['manha', 'tarde', 'unica']),
});

/** Limite de litros por vaca em uma ordenha, para pegar erros de digitação. */
export const LITROS_MAXIMO_ORDENHA = 80;

export const esquemaLitros = z
  .number()
  .min(0, 'Valor inválido.')
  .max(LITROS_MAXIMO_ORDENHA, `Máximo de ${LITROS_MAXIMO_ORDENHA} L por ordenha.`)
  .nullable();
