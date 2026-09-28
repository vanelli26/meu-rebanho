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

/** Compara brincos em ordem natural ("2" antes de "10"). */
export function compararBrinco(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' });
}

const semAcento = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Filtra por brinco ou nome (sem diferenciar acentos) e ordena pelo brinco. */
export function buscarAnimais<T extends Pick<Animal, 'brinco' | 'nome'>>(
  animais: readonly T[],
  termo: string,
): T[] {
  const busca = semAcento(termo.trim());
  const filtrados = busca
    ? animais.filter(
        (a) => semAcento(a.brinco).includes(busca) || semAcento(a.nome).includes(busca),
      )
    : [...animais];
  // Brinco que começa com o termo aparece antes (busca por número no curral).
  const comeca = (a: T) => (busca && semAcento(a.brinco).startsWith(busca) ? 0 : 1);
  return filtrados.sort((a, b) => comeca(a) - comeca(b) || compararBrinco(a.brinco, b.brinco));
}

/** "123 · Mimosa" ou só "123". */
export function identificacao(animal: Pick<Animal, 'brinco' | 'nome'>): string {
  return animal.nome ? `${animal.brinco} · ${animal.nome}` : animal.brinco;
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
    nome: textoOpcional(60),
    raca: textoOpcional(40),
    sexo: z.enum(['F', 'M']),
    dataNascimento: dataOpcional,
    pai: textoOpcional(60),
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

export const FORMULARIO_ANIMAL_VAZIO: FormularioAnimal = {
  brinco: '',
  nome: '',
  raca: '',
  sexo: 'F',
  dataNascimento: null,
  pai: '',
  origem: 'nascido',
  dataEntrada: null,
  status: 'ativo',
  dataSaida: null,
  motivoSaida: '',
  observacoes: '',
};

/** Converte o formulário validado nos dados a gravar. */
export function montarDadosAnimal(form: FormularioAnimal, maeId: string | null): DadosAnimal {
  const ativo = form.status === 'ativo';
  return {
    brinco: form.brinco.trim(),
    nome: form.nome.trim(),
    raca: form.raca.trim(),
    sexo: form.sexo,
    dataNascimento: form.dataNascimento,
    maeId,
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
    origem: animal.origem,
    dataEntrada: animal.dataEntrada,
    status: animal.status,
    dataSaida: animal.dataSaida,
    motivoSaida: animal.motivoSaida,
    observacoes: animal.observacoes,
  };
}
