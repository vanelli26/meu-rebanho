import { z } from 'zod';

import { diasEntre, ehDataISO, type DataISO } from '@/lib/datas';
import { reaisParaCentavos } from '@/lib/dinheiro';

export type CategoriaDespesa =
  | 'racao'
  | 'volumoso'
  | 'tratamentos'
  | 'reproducao'
  | 'mao_de_obra'
  | 'combustivel'
  | 'energia'
  | 'manutencao'
  | 'outros';

export const CATEGORIAS_DESPESA: readonly CategoriaDespesa[] = [
  'racao',
  'volumoso',
  'tratamentos',
  'reproducao',
  'mao_de_obra',
  'combustivel',
  'energia',
  'manutencao',
  'outros',
];

export const ROTULO_CATEGORIA: Record<CategoriaDespesa, string> = {
  racao: 'Ração e concentrado',
  volumoso: 'Silagem e volumoso',
  tratamentos: 'Tratamentos',
  reproducao: 'Sêmen e reprodução',
  mao_de_obra: 'Mão de obra',
  combustivel: 'Combustível',
  energia: 'Energia',
  manutencao: 'Manutenção',
  outros: 'Outros',
};

/** Categorias que contam como custo de alimentação. */
export const CATEGORIAS_ALIMENTACAO: readonly CategoriaDespesa[] = ['racao', 'volumoso'];

/** Para quem é a despesa: base do rateio entre os animais. */
export type GrupoDestino = 'rebanho' | 'lactacao' | 'secas' | 'recria' | 'animais';

export const ROTULO_GRUPO: Record<GrupoDestino, string> = {
  rebanho: 'Todo o rebanho',
  lactacao: 'Vacas em lactação',
  secas: 'Vacas secas',
  recria: 'Bezerras e novilhas',
  animais: 'Animais escolhidos',
};

/** Grupo sugerido ao escolher a categoria. */
export const GRUPO_SUGERIDO: Record<CategoriaDespesa, GrupoDestino> = {
  racao: 'lactacao',
  volumoso: 'rebanho',
  tratamentos: 'animais',
  reproducao: 'lactacao',
  mao_de_obra: 'rebanho',
  combustivel: 'rebanho',
  energia: 'rebanho',
  manutencao: 'rebanho',
  outros: 'rebanho',
};

export const UNIDADES = ['kg', 'sc', 't', 'L', 'un'] as const;
export type Unidade = (typeof UNIDADES)[number];

/** `fazendas/{id}/despesas/{despesaId}`. Valor em centavos. */
export type Despesa = {
  id: string;
  data: DataISO;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  quantidade: number | null;
  unidade: Unidade | null;
  grupo: GrupoDestino;
  animalIds: string[];
  /** Só em lactação: divide pelos litros de cada vaca em vez de por cabeça-dia. */
  porLitros: boolean;
  /** Despesa criada por um tratamento (editada por lá). */
  tratamentoId: string | null;
};

/** Despesas entre `inicio` e `fim` (inclusive), da mais recente para a mais antiga. */
export function despesasDoPeriodo<T extends Pick<Despesa, 'data'>>(
  despesas: readonly T[],
  inicio: DataISO,
  fim: DataISO,
): T[] {
  return despesas
    .filter((d) => d.data >= inicio && d.data <= fim)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export type ResumoDespesas = {
  total: number;
  alimentacao: number;
  /** Categorias com gasto, do maior para o menor. */
  porCategoria: { categoria: CategoriaDespesa; valor: number }[];
};

export function resumirDespesas(
  despesas: readonly Pick<Despesa, 'categoria' | 'valor'>[],
): ResumoDespesas {
  const soma = new Map<CategoriaDespesa, number>();
  for (const d of despesas) soma.set(d.categoria, (soma.get(d.categoria) ?? 0) + d.valor);
  const porCategoria = [...soma.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
  const total = porCategoria.reduce((t, c) => t + c.valor, 0);
  const alimentacao = porCategoria
    .filter((c) => CATEGORIAS_ALIMENTACAO.includes(c.categoria))
    .reduce((t, c) => t + c.valor, 0);
  return { total, alimentacao, porCategoria };
}

export type ResultadoMes = {
  receita: number;
  despesas: number;
  /** Receita − despesas, em centavos. */
  resultado: number;
  /** Despesas / litros produzidos (entregues + descartados), em reais. */
  custoPorLitro: number | null;
  /** Receita / litros entregues com preço, em reais. */
  precoMedio: number | null;
  /** Alimentação / despesas, em %. */
  percentualAlimentacao: number | null;
  /** Litros por dia que pagariam as despesas no preço médio. */
  litrosDiaEquilibrio: number | null;
};

export function calcularResultadoMes({
  receita,
  litrosComPreco,
  litrosProduzidos,
  despesas,
  inicio,
  fim,
}: {
  receita: number;
  litrosComPreco: number;
  litrosProduzidos: number;
  despesas: ResumoDespesas;
  inicio: DataISO;
  fim: DataISO;
}): ResultadoMes {
  const dias = diasEntre(inicio, fim) + 1;
  const precoMedio = litrosComPreco > 0 ? receita / 100 / litrosComPreco : null;
  return {
    receita,
    despesas: despesas.total,
    resultado: receita - despesas.total,
    custoPorLitro:
      litrosProduzidos > 0 && despesas.total > 0 ? despesas.total / 100 / litrosProduzidos : null,
    precoMedio,
    percentualAlimentacao: despesas.total
      ? Math.round((despesas.alimentacao / despesas.total) * 100)
      : null,
    litrosDiaEquilibrio:
      precoMedio && despesas.total ? Math.round(despesas.total / 100 / precoMedio / dias) : null,
  };
}

// ---------------------------------------------------------------------------
// Formulário

export const VALOR_MAXIMO_DESPESA = 1_000_000;

export const esquemaDespesa = z
  .object({
    categoria: z
      .enum(CATEGORIAS_DESPESA as [CategoriaDespesa, ...CategoriaDespesa[]])
      .nullable()
      .refine((v) => v !== null, 'Escolha a categoria.')
      .transform((v) => v as CategoriaDespesa),
    data: z
      .string()
      .nullable()
      .refine((v) => v !== null && ehDataISO(v), 'Informe a data.')
      .transform((v) => v as DataISO),
    /** Em reais no formulário; gravado em centavos. */
    valor: z
      .number()
      .nullable()
      .refine((v) => v !== null && v > 0, 'Informe o valor.')
      .transform((v) => v as number)
      .refine((v) => v <= VALOR_MAXIMO_DESPESA, 'Valor muito alto. Confira a digitação.'),
    descricao: z.string().trim().max(80, 'Texto muito longo.'),
    quantidade: z.number().positive('Valor inválido.').nullable(),
    unidade: z.enum(UNIDADES).nullable(),
    grupo: z.enum(['rebanho', 'lactacao', 'secas', 'recria', 'animais']),
    animalIds: z.array(z.string()),
    porLitros: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.grupo === 'animais' && d.animalIds.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['animalIds'], message: 'Escolha ao menos um animal.' });
    }
  });

export type FormularioDespesa = z.input<typeof esquemaDespesa>;
export type DespesaValidada = z.output<typeof esquemaDespesa>;

export type DadosDespesa = Omit<Despesa, 'id'>;

export function montarDespesa(
  form: DespesaValidada,
  tratamentoId: string | null = null,
): DadosDespesa {
  return {
    data: form.data,
    categoria: form.categoria,
    descricao: form.descricao,
    valor: reaisParaCentavos(form.valor),
    quantidade: form.quantidade,
    unidade: form.quantidade ? (form.unidade ?? 'un') : null,
    grupo: form.grupo,
    animalIds: form.grupo === 'animais' ? form.animalIds : [],
    porLitros: form.grupo === 'lactacao' && form.porLitros,
    tratamentoId,
  };
}

export function formularioDaDespesa(d: Despesa): FormularioDespesa {
  return {
    categoria: d.categoria,
    data: d.data,
    valor: d.valor / 100,
    descricao: d.descricao,
    quantidade: d.quantidade,
    unidade: d.unidade,
    grupo: d.grupo,
    animalIds: d.animalIds,
    porLitros: d.porLitros,
  };
}
