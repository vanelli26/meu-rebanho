import { z } from 'zod';

import { diasEntre, ehDataISO, somarDias, type DataISO } from '@/lib/datas';

import type { ConfiguracoesFazenda } from './fazenda';

export type TipoEvento =
  | 'cio'
  | 'inseminacao'
  | 'cobertura'
  | 'diagnostico_positivo'
  | 'diagnostico_negativo'
  | 'parto'
  | 'aborto'
  | 'secagem';

export const TIPOS_EVENTO: readonly TipoEvento[] = [
  'cio',
  'inseminacao',
  'cobertura',
  'diagnostico_positivo',
  'diagnostico_negativo',
  'parto',
  'aborto',
  'secagem',
];

export const ROTULO_EVENTO: Record<TipoEvento, string> = {
  cio: 'Cio',
  inseminacao: 'Inseminação',
  cobertura: 'Cobertura',
  diagnostico_positivo: 'Diagnóstico positivo',
  diagnostico_negativo: 'Diagnóstico negativo',
  parto: 'Parto',
  aborto: 'Aborto',
  secagem: 'Secagem',
};

/** Campos usados pelas regras. Os demais (responsável, observações) só são exibidos. */
export type EventoReprodutivo = {
  id: string;
  data: DataISO;
  tipo: TipoEvento;
  touroSemen: string;
  responsavel: string;
  criaId: string | null;
  observacoes: string;
};

export const ehServico = (tipo: TipoEvento) => tipo === 'inseminacao' || tipo === 'cobertura';

/**
 * Ordem dentro do mesmo dia: o que encerra um ciclo vem antes do que começa outro
 * (ex.: parto e depois cio; inseminação e depois diagnóstico).
 */
const ORDEM_NO_DIA: Record<TipoEvento, number> = {
  aborto: 0,
  parto: 1,
  secagem: 2,
  cio: 3,
  inseminacao: 4,
  cobertura: 4,
  diagnostico_negativo: 5,
  diagnostico_positivo: 5,
};

/** Ordena do mais antigo para o mais recente, sem alterar a lista original. */
export function ordenarEventos<T extends Pick<EventoReprodutivo, 'data' | 'tipo'>>(
  eventos: readonly T[],
): T[] {
  return [...eventos].sort(
    (a, b) => a.data.localeCompare(b.data) || ORDEM_NO_DIA[a.tipo] - ORDEM_NO_DIA[b.tipo],
  );
}

export type EstadoReprodutivo = {
  ultimoParto: DataISO | null;
  ultimaSecagem: DataISO | null;
  ultimaCobertura: DataISO | null;
  numeroPartos: number;
  prenhe: boolean;
  /** Serviço confirmado pelo diagnóstico positivo, base da previsão de parto. */
  servicoConfirmado: DataISO | null;
  servicoSemDiagnostico: DataISO | null;
  previsaoParto: DataISO | null;
  previsaoSecagem: DataISO | null;
  /** Dias entre partos consecutivos, do mais antigo para o mais recente. */
  intervalosEntrePartos: number[];
};

/**
 * Percorre os eventos em ordem e calcula a situação reprodutiva.
 * Prenhe = diagnóstico positivo após a última inseminação/cobertura, sem parto ou aborto depois.
 */
export function estadoReprodutivo(
  eventos: readonly Pick<EventoReprodutivo, 'data' | 'tipo'>[],
  config: Pick<ConfiguracoesFazenda, 'diasGestacao' | 'diasSecagemAntesParto'>,
): EstadoReprodutivo {
  let ultimoParto: DataISO | null = null;
  let ultimaSecagem: DataISO | null = null;
  let ultimaCobertura: DataISO | null = null;
  let prenhe = false;
  let servicoConfirmado: DataISO | null = null;
  let servicoSemDiagnostico: DataISO | null = null;
  const partos: DataISO[] = [];

  for (const evento of ordenarEventos(eventos)) {
    switch (evento.tipo) {
      case 'inseminacao':
      case 'cobertura':
        ultimaCobertura = evento.data;
        servicoSemDiagnostico = evento.data;
        prenhe = false;
        servicoConfirmado = null;
        break;
      case 'diagnostico_positivo':
        prenhe = true;
        servicoConfirmado = servicoSemDiagnostico ?? servicoConfirmado;
        servicoSemDiagnostico = null;
        break;
      case 'diagnostico_negativo':
        prenhe = false;
        servicoConfirmado = null;
        servicoSemDiagnostico = null;
        break;
      case 'parto':
        ultimoParto = evento.data;
        partos.push(evento.data);
        prenhe = false;
        servicoConfirmado = null;
        servicoSemDiagnostico = null;
        break;
      case 'aborto':
        prenhe = false;
        servicoConfirmado = null;
        servicoSemDiagnostico = null;
        break;
      case 'secagem':
        ultimaSecagem = evento.data;
        break;
      case 'cio':
        break;
    }
  }

  const previsaoParto = servicoConfirmado
    ? somarDias(servicoConfirmado, config.diasGestacao)
    : null;
  const previsaoSecagem = previsaoParto
    ? somarDias(previsaoParto, -config.diasSecagemAntesParto)
    : null;

  return {
    ultimoParto,
    ultimaSecagem,
    ultimaCobertura,
    numeroPartos: partos.length,
    prenhe,
    servicoConfirmado,
    servicoSemDiagnostico,
    previsaoParto,
    previsaoSecagem,
    intervalosEntrePartos: partos.slice(1).map((parto, i) => diasEntre(partos[i], parto)),
  };
}

/**
 * Último serviço (inseminação/cobertura) até a data do parto: dele vem o pai da cria.
 */
export function servicoDoParto<T extends Pick<EventoReprodutivo, 'data' | 'tipo'>>(
  eventos: readonly T[],
  dataParto: DataISO,
): T | null {
  const servicos = ordenarEventos(eventos).filter((e) => ehServico(e.tipo) && e.data <= dataParto);
  return servicos.at(-1) ?? null;
}

// ---------------------------------------------------------------------------
// Formulário

const texto = (max: number) => z.string().trim().max(max, 'Texto muito longo.');

export const esquemaEvento = z
  .object({
    animalId: z.string().min(1, 'Escolha o animal.'),
    tipo: z
      .enum(TIPOS_EVENTO as [TipoEvento, ...TipoEvento[]])
      .nullable()
      .refine((v): v is TipoEvento => v !== null, 'Escolha o tipo.'),
    data: z
      .string({ error: 'Informe a data.' })
      .nullable()
      .refine((v): v is string => v !== null && ehDataISO(v), 'Informe uma data válida.'),
    touroSemen: texto(60),
    responsavel: texto(60),
    observacoes: texto(500),
    cria: z.object({
      cadastrar: z.boolean(),
      brinco: texto(20),
      nome: texto(60),
      sexo: z.enum(['F', 'M']),
    }),
  })
  .superRefine((d, ctx) => {
    if (d.tipo !== 'parto' || !d.cria.cadastrar) return;
    if (!d.cria.nome) {
      ctx.addIssue({ code: 'custom', path: ['cria', 'nome'], message: 'Informe o nome da cria.' });
    }
    if (!d.cria.brinco) {
      ctx.addIssue({
        code: 'custom',
        path: ['cria', 'brinco'],
        message: 'Informe o brinco da cria.',
      });
    }
  });

export type FormularioEvento = z.input<typeof esquemaEvento>;
export type EventoValidado = z.output<typeof esquemaEvento>;

/** Pode registrar o evento na data informada? Retorna a mensagem de erro, se houver. */
export function validarEventoNaData(
  data: DataISO,
  hoje: DataISO,
  animal: { sexo: 'F' | 'M'; dataNascimento: DataISO | null },
): string | null {
  if (animal.sexo === 'M') return 'Eventos reprodutivos são só para fêmeas.';
  if (data > hoje) return 'A data não pode ser no futuro.';
  if (animal.dataNascimento && data < animal.dataNascimento) {
    return 'A data é anterior ao nascimento do animal.';
  }
  return null;
}
