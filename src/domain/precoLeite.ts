import { z } from 'zod';

import { ehDataISO, somarDias, type DataISO } from '@/lib/datas';

import type { ProducaoOrdenha } from './producao';

/**
 * `fazendas/{id}/precosLeite/{inicio}`. O id é a data de início: cadastrar de novo
 * na mesma data substitui o preço, sem duplicar. O fim da vigência não é gravado:
 * cada preço vale até a véspera do próximo, então nunca há dois preços valendo
 * ao mesmo tempo, mesmo offline.
 */
export type PrecoLeite = {
  id: string;
  inicio: DataISO;
  /** Reais por litro, até 4 casas. */
  valorLitro: number;
  observacao: string;
};

export type Vigencia = PrecoLeite & { fim: DataISO | null };

/** Do mais recente para o mais antigo, com o fim de cada vigência. */
export function vigencias(precos: readonly PrecoLeite[]): Vigencia[] {
  const ordenados = [...precos].sort((a, b) => b.inicio.localeCompare(a.inicio));
  return ordenados.map((p, i) => ({
    ...p,
    fim: i === 0 ? null : somarDias(ordenados[i - 1].inicio, -1),
  }));
}

/** Preço que valia na data, ou `null` se ainda não havia preço cadastrado. */
export function precoNaData(precos: readonly PrecoLeite[], data: DataISO): PrecoLeite | null {
  let vigente: PrecoLeite | null = null;
  for (const p of precos) {
    if (p.inicio <= data && (!vigente || p.inicio > vigente.inicio)) vigente = p;
  }
  return vigente;
}

export type Receita = {
  litrosEntregues: number;
  /** Litros entregues × preço vigente em cada ordenha, em centavos. */
  receita: number;
  litrosDescartados: number;
  /** Quanto o leite descartado teria rendido, em centavos. */
  valorDescartado: number;
  /** Litros de dias sem preço cadastrado (ficam fora da receita). */
  litrosSemPreco: number;
};

const arredondarLitros = (litros: number) => Math.round(litros * 10) / 10;

/** Receita das ordenhas entre `inicio` e `fim` (inclusive). */
export function calcularReceita(
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'totalLitros' | 'totalDescartado'>[],
  precos: readonly PrecoLeite[],
  inicio: DataISO,
  fim: DataISO,
): Receita {
  let litrosEntregues = 0;
  let receita = 0;
  let litrosDescartados = 0;
  let valorDescartado = 0;
  let litrosSemPreco = 0;
  for (const p of producoes) {
    if (p.data < inicio || p.data > fim) continue;
    litrosEntregues += p.totalLitros;
    litrosDescartados += p.totalDescartado;
    const preco = precoNaData(precos, p.data);
    if (!preco) {
      litrosSemPreco += p.totalLitros;
      continue;
    }
    receita += Math.round(p.totalLitros * preco.valorLitro * 100);
    valorDescartado += Math.round(p.totalDescartado * preco.valorLitro * 100);
  }
  return {
    litrosEntregues: arredondarLitros(litrosEntregues),
    receita,
    litrosDescartados: arredondarLitros(litrosDescartados),
    valorDescartado,
    litrosSemPreco: arredondarLitros(litrosSemPreco),
  };
}

// ---------------------------------------------------------------------------
// Formulário

/** Faixa aceita, em R$/L, para pegar erro de digitação (ex.: 250 em vez de 2,50). */
export const PRECO_LITRO_MINIMO = 0.5;
export const PRECO_LITRO_MAXIMO = 10;

export const esquemaPrecoLeite = z.object({
  inicio: z
    .string()
    .nullable()
    .refine((v) => v !== null && ehDataISO(v), 'Informe a data de início.')
    .transform((v) => v as DataISO),
  valorLitro: z
    .number()
    .nullable()
    .refine((v) => v !== null, 'Informe o preço do litro.')
    .transform((v) => v as number)
    .refine(
      (v) => v >= PRECO_LITRO_MINIMO && v <= PRECO_LITRO_MAXIMO,
      `Use um valor entre R$ ${PRECO_LITRO_MINIMO.toFixed(2).replace('.', ',')} e R$ ${PRECO_LITRO_MAXIMO},00 por litro.`,
    )
    .refine(
      (v) => Math.abs(Math.round(v * 10000) - v * 10000) < 1e-6,
      'Use no máximo 4 casas decimais.',
    ),
  observacao: z.string().trim().max(120, 'Texto muito longo.'),
});

export type FormularioPrecoLeite = z.input<typeof esquemaPrecoLeite>;
export type PrecoLeiteValidado = z.output<typeof esquemaPrecoLeite>;
