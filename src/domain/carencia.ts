import { z } from 'zod';

import { ehDataISO, somarDias, type DataISO } from '@/lib/datas';

export type TipoTratamento = 'vacina' | 'vermifugo' | 'antibiotico' | 'hormonio' | 'outro';

export const TIPOS_TRATAMENTO: readonly TipoTratamento[] = [
  'antibiotico',
  'vacina',
  'vermifugo',
  'hormonio',
  'outro',
];

export const ROTULO_TRATAMENTO: Record<TipoTratamento, string> = {
  antibiotico: 'Antibiótico',
  vacina: 'Vacina',
  vermifugo: 'Vermífugo',
  hormonio: 'Hormônio',
  outro: 'Outro',
};

/** `animais/{id}/tratamentos/{tratamentoId}`, com o id do documento. */
export type Tratamento = {
  id: string;
  data: DataISO;
  tipo: TipoTratamento;
  produto: string;
  dose: string;
  via: string;
  carenciaLeiteDias: number;
  carenciaCarneDias: number;
  observacoes: string;
};

type Carencias = Pick<Tratamento, 'data' | 'carenciaLeiteDias' | 'carenciaCarneDias'>;

/** Último dia de carência (inclusive): data do tratamento + dias. `null` sem carência. */
export function fimCarencia(data: DataISO, dias: number): DataISO | null {
  return dias > 0 ? somarDias(data, dias) : null;
}

const maiorData = (datas: (DataISO | null)[]): DataISO | null =>
  datas.reduce<DataISO | null>((maior, d) => (d && (!maior || d > maior) ? d : maior), null);

/** Maior fim de carência de leite entre os tratamentos. Vai para `resumo.carenciaLeiteAte`. */
export function carenciaLeiteAte(tratamentos: readonly Carencias[]): DataISO | null {
  return maiorData(tratamentos.map((t) => fimCarencia(t.data, t.carenciaLeiteDias)));
}

/** Maior fim de carência de carne entre os tratamentos (abate ou venda para corte). */
export function carenciaCarneAte(tratamentos: readonly Carencias[]): DataISO | null {
  return maiorData(tratamentos.map((t) => fimCarencia(t.data, t.carenciaCarneDias)));
}

/** `true` se o leite da ordenha nessa data não pode ir para o tanque. */
export function emCarenciaLeite(carenciaAte: DataISO | null, data: DataISO): boolean {
  return carenciaAte !== null && carenciaAte >= data;
}

/**
 * `true` se algum tratamento cobre a data: aplicado até ela e com carência ainda
 * valendo. Mais preciso que o resumo para ordenhas passadas (um tratamento
 * posterior não conta).
 */
export function emCarenciaLeiteNaData(tratamentos: readonly Carencias[], data: DataISO): boolean {
  return tratamentos.some(
    (t) => t.data <= data && emCarenciaLeite(fimCarencia(t.data, t.carenciaLeiteDias), data),
  );
}

/** Tratamentos do mais recente para o mais antigo. */
export function ordenarTratamentos<T extends Pick<Tratamento, 'data'>>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => b.data.localeCompare(a.data));
}

// ---------------------------------------------------------------------------
// Formulário

/** Carência acima disso é quase certamente erro de digitação. */
export const CARENCIA_MAXIMA_DIAS = 365;

const dias = z
  .number()
  .int('Use dias inteiros.')
  .min(0, 'Valor inválido.')
  .max(CARENCIA_MAXIMA_DIAS, `Máximo de ${CARENCIA_MAXIMA_DIAS} dias.`)
  .nullable()
  .refine((v) => v !== null, 'Informe os dias (0 se não tiver).')
  .transform((v) => v ?? 0);

export const esquemaTratamento = z.object({
  animalIds: z.array(z.string()).min(1, 'Escolha ao menos um animal.'),
  tipo: z
    .enum(['vacina', 'vermifugo', 'antibiotico', 'hormonio', 'outro'])
    .nullable()
    .refine((v) => v !== null, 'Escolha o tipo.')
    .transform((v) => v as TipoTratamento),
  data: z
    .string()
    .nullable()
    .refine((v) => v !== null && ehDataISO(v), 'Informe a data.')
    .transform((v) => v as DataISO),
  produto: z.string().trim().min(1, 'Informe o produto.').max(80, 'Texto muito longo.'),
  dose: z.string().trim().max(40, 'Texto muito longo.'),
  via: z.string().trim().max(40, 'Texto muito longo.'),
  carenciaLeiteDias: dias,
  carenciaCarneDias: dias,
  observacoes: z.string().trim().max(500, 'Texto muito longo.'),
});

export type FormularioTratamento = z.input<typeof esquemaTratamento>;
export type TratamentoValidado = z.output<typeof esquemaTratamento>;

/** Dados do tratamento a gravar em cada animal. */
export type NovoTratamento = Omit<Tratamento, 'id'>;

export function montarTratamento(form: TratamentoValidado): NovoTratamento {
  return {
    data: form.data,
    tipo: form.tipo,
    produto: form.produto,
    dose: form.dose,
    via: form.via,
    carenciaLeiteDias: form.carenciaLeiteDias,
    carenciaCarneDias: form.carenciaCarneDias,
    observacoes: form.observacoes,
  };
}

export const VIAS_SUGERIDAS = ['Intramuscular', 'Subcutânea', 'Intramamária', 'Oral', 'Pour-on'];
