import { differenceInMonths, parseISO } from 'date-fns';
import { z } from 'zod';

import { ehDataISO, type DataISO } from '@/lib/datas';

export type Sexo = 'F' | 'M';
export type Origem = 'nascido' | 'comprado';
export type StatusAnimal = 'ativo' | 'vendido' | 'morto' | 'descartado';
export type Situacao = 'novilha' | 'lactacao' | 'seca' | 'bezerra' | 'macho';

/** Idade (em meses) a partir da qual uma fêmea sem parto deixa de ser bezerra. */
export const MESES_BEZERRA = 12;

/** Resumo calculado a partir dos eventos. Escrito só por `resumoAnimal.ts`. */
export type ResumoAnimal = {
  situacao: Situacao;
  prenhe: boolean;
  ultimoParto: DataISO | null;
  ultimaCobertura: DataISO | null;
  ultimaSecagem: DataISO | null;
  previsaoParto: DataISO | null;
  previsaoSecagem: DataISO | null;
  /** Inseminação/cobertura ainda sem diagnóstico, parto ou aborto depois. */
  servicoSemDiagnostico: DataISO | null;
  carenciaLeiteAte: DataISO | null;
  numeroPartos: number;
};

/** Dados cadastrais, editados pelo usuário. */
export type DadosAnimal = {
  brinco: string;
  nome: string;
  raca: string;
  sexo: Sexo;
  dataNascimento: DataISO | null;
  maeId: string | null;
  pai: string;
  origem: Origem;
  dataEntrada: DataISO | null;
  status: StatusAnimal;
  dataSaida: DataISO | null;
  motivoSaida: string;
  observacoes: string;
};

export type Animal = DadosAnimal & { id: string; resumo: ResumoAnimal };

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  lactacao: 'Em lactação',
  seca: 'Seca',
  novilha: 'Novilha',
  bezerra: 'Bezerra',
  macho: 'Macho',
};

export const ROTULO_STATUS: Record<StatusAnimal, string> = {
  ativo: 'Ativo',
  vendido: 'Vendido',
  morto: 'Morto',
  descartado: 'Descartado',
};

/** Normaliza o brinco para comparação: sem espaços e zeros à esquerda, maiúsculo. */
export function chaveBrinco(brinco: string): string {
  const limpo = brinco.trim().toUpperCase().replace(/\s+/g, '');
  return /^\d+$/.test(limpo) ? String(Number(limpo)) : limpo;
}

/** `true` se nenhum outro animal da fazenda usa o brinco (ignora o próprio `idAtual`). */
export function brincoDisponivel(
  brinco: string,
  animais: readonly Pick<Animal, 'id' | 'brinco'>[],
  idAtual?: string,
): boolean {
  const chave = chaveBrinco(brinco);
  return !animais.some((a) => a.id !== idAtual && chaveBrinco(a.brinco) === chave);
}

/** Macho, bezerra (até `MESES_BEZERRA`) ou novilha. Sem data de nascimento: novilha. */
export function situacaoSemParto(sexo: Sexo, dataNascimento: DataISO | null, hoje: Date): Situacao {
  if (sexo === 'M') return 'macho';
  if (dataNascimento && differenceInMonths(hoje, parseISO(dataNascimento)) < MESES_BEZERRA) {
    return 'bezerra';
  }
  return 'novilha';
}

/**
 * Situação para exibir hoje. O resumo só é recalculado quando há gravação, então
 * uma bezerra que completou a idade passa a novilha aqui, sem precisar gravar.
 */
export function situacaoAtual(
  animal: Pick<Animal, 'sexo' | 'dataNascimento' | 'resumo'>,
  hoje: Date,
): Situacao {
  if (animal.resumo.situacao === 'bezerra') {
    return situacaoSemParto(animal.sexo, animal.dataNascimento, hoje);
  }
  return animal.resumo.situacao;
}

const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Normaliza o nome para comparação: sem acentos, caixa e espaços extras. */
export function chaveNome(nome: string): string {
  return semAcento(nome.trim().replace(/\s+/g, ' '));
}

/** `true` se nenhum outro animal da fazenda usa o nome (ignora o próprio `idAtual`). */
export function nomeDisponivel(
  nome: string,
  animais: readonly Pick<Animal, 'id' | 'nome'>[],
  idAtual?: string,
): boolean {
  const chave = chaveNome(nome);
  return !animais.some((a) => a.id !== idAtual && chaveNome(a.nome) === chave);
}

/**
 * Nome que identifica o animal nas telas. Animais antigos, cadastrados quando o
 * nome era opcional, aparecem pelo brinco.
 */
export function identificacao(animal: Pick<Animal, 'brinco' | 'nome'>): string {
  return animal.nome.trim() || `Brinco ${animal.brinco}`;
}

/** Ordem alfabética pelo nome (identificação), com números em ordem natural. */
export function compararNome(
  a: Pick<Animal, 'brinco' | 'nome'>,
  b: Pick<Animal, 'brinco' | 'nome'>,
): number {
  return identificacao(a).localeCompare(identificacao(b), 'pt-BR', {
    numeric: true,
    sensitivity: 'base',
  });
}

/** Prenhes primeiro pela data prevista de parto; sem previsão vão para o fim, por nome. */
export function ordenarPorPrevisaoParto<T extends Pick<Animal, 'brinco' | 'nome' | 'resumo'>>(
  animais: readonly T[],
): T[] {
  return [...animais].sort((a, b) => {
    const pa = a.resumo.previsaoParto;
    const pb = b.resumo.previsaoParto;
    if (pa && pb && pa !== pb) return pa.localeCompare(pb);
    if (pa && !pb) return -1;
    if (!pa && pb) return 1;
    return compararNome(a, b);
  });
}

/**
 * Filtra por nome ou brinco (sem diferenciar acentos) e ordena pelo nome.
 * Nomes que começam com o termo aparecem antes.
 */
export function buscarAnimais<T extends Pick<Animal, 'brinco' | 'nome'>>(
  animais: readonly T[],
  termo: string,
): T[] {
  const busca = semAcento(termo.trim());
  const filtrados = busca
    ? animais.filter(
        (a) => semAcento(a.nome).includes(busca) || semAcento(a.brinco).includes(busca),
      )
    : [...animais];
  const comeca = (a: T) => (busca && semAcento(a.nome).startsWith(busca) ? 0 : 1);
  return filtrados.sort((a, b) => comeca(a) - comeca(b) || compararNome(a, b));
}

// ---------------------------------------------------------------------------
// Formulário

const dataOpcional = z
  .string()
  .nullable()
  .refine((v) => v === null || ehDataISO(v), 'Data inválida.');

const textoOpcional = (max: number) => z.string().trim().max(max, 'Texto muito longo.');

export const esquemaAnimal = z
  .object({
    brinco: z.string().trim().min(1, 'Informe o brinco.').max(20, 'Brinco muito longo.'),
    nome: z.string().trim().min(1, 'Informe o nome.').max(60, 'Nome muito longo.'),
    raca: textoOpcional(40),
    sexo: z.enum(['F', 'M']),
    dataNascimento: dataOpcional,
    pai: textoOpcional(60),
    maeId: z.string().nullable(),
    origem: z.enum(['nascido', 'comprado']),
    dataEntrada: dataOpcional,
    status: z.enum(['ativo', 'vendido', 'morto', 'descartado']),
    dataSaida: dataOpcional,
    motivoSaida: textoOpcional(120),
    observacoes: textoOpcional(500),
  })
  .superRefine((d, ctx) => {
    if (d.status !== 'ativo' && !d.dataSaida) {
      ctx.addIssue({ code: 'custom', path: ['dataSaida'], message: 'Informe a data de saída.' });
    }
    if (d.dataNascimento && d.dataEntrada && d.dataEntrada < d.dataNascimento) {
      ctx.addIssue({
        code: 'custom',
        path: ['dataEntrada'],
        message: 'A entrada não pode ser antes do nascimento.',
      });
    }
  });

export type FormularioAnimal = z.infer<typeof esquemaAnimal>;

type CampoData = 'dataNascimento' | 'dataEntrada' | 'dataSaida';

/**
 * Datas do cadastro que dependem de hoje (o esquema não sabe a data): nada no
 * futuro, e a saída não antes do nascimento ou da entrada.
 */
export function validarDatasAnimal(
  form: Pick<FormularioAnimal, CampoData | 'status' | 'origem'>,
  hoje: DataISO,
): Partial<Record<CampoData, string>> {
  const erros: Partial<Record<CampoData, string>> = {};
  const futuro = 'A data não pode ser no futuro.';
  if (form.dataNascimento && form.dataNascimento > hoje) erros.dataNascimento = futuro;
  if (form.origem === 'comprado' && form.dataEntrada && form.dataEntrada > hoje) {
    erros.dataEntrada = futuro;
  }
  if (form.status !== 'ativo' && form.dataSaida) {
    const inicio = [form.dataNascimento, form.origem === 'comprado' ? form.dataEntrada : null]
      .filter((d): d is DataISO => !!d)
      .sort()
      .at(-1);
    if (form.dataSaida > hoje) erros.dataSaida = futuro;
    else if (inicio && form.dataSaida < inicio) {
      erros.dataSaida = 'A saída não pode ser antes do nascimento ou da entrada.';
    }
  }
  return erros;
}

export const FORMULARIO_ANIMAL_VAZIO: FormularioAnimal = {
  brinco: '',
  nome: '',
  raca: '',
  sexo: 'F',
  dataNascimento: null,
  pai: '',
  maeId: null,
  origem: 'nascido',
  dataEntrada: null,
  status: 'ativo',
  dataSaida: null,
  motivoSaida: '',
  observacoes: '',
};

/** Converte o formulário validado nos dados a gravar. */
export function montarDadosAnimal(form: FormularioAnimal): DadosAnimal {
  const ativo = form.status === 'ativo';
  return {
    brinco: form.brinco.trim(),
    nome: form.nome.trim(),
    raca: form.raca.trim(),
    sexo: form.sexo,
    dataNascimento: form.dataNascimento,
    maeId: form.maeId,
    pai: form.pai.trim(),
    origem: form.origem,
    dataEntrada: form.dataEntrada,
    status: form.status,
    dataSaida: ativo ? null : form.dataSaida,
    motivoSaida: ativo ? '' : form.motivoSaida.trim(),
    observacoes: form.observacoes.trim(),
  };
}

export function formularioDoAnimal(animal: DadosAnimal): FormularioAnimal {
  return {
    brinco: animal.brinco,
    nome: animal.nome,
    raca: animal.raca,
    sexo: animal.sexo,
    dataNascimento: animal.dataNascimento,
    pai: animal.pai,
    maeId: animal.maeId,
    origem: animal.origem,
    dataEntrada: animal.dataEntrada,
    status: animal.status,
    dataSaida: animal.dataSaida,
    motivoSaida: animal.motivoSaida,
    observacoes: animal.observacoes,
  };
}
