import { isoParaBR, type DataISO } from '@/lib/datas';

import { compararNome, identificacao, ROTULO_SITUACAO, ROTULO_STATUS, type Animal } from './animal';
import { ROTULO_TRATAMENTO, type Tratamento } from './carencia';
import { ROTULO_CATEGORIA, ROTULO_GRUPO, type Despesa } from './despesas';
import type { ResultadoAnimal } from './rateio';
import { ORDENHAS, ROTULO_ORDENHA, type ProducaoOrdenha } from './producao';
import { ROTULO_EVENTO, type EventoReprodutivo } from './reproducao';

type Celula = string | number | boolean | null;

/**
 * CSV no formato que o Excel em português abre direto: `;` como separador,
 * vírgula decimal, datas `dd/MM/yyyy` e BOM para os acentos.
 */
export function gerarCSV(cabecalho: readonly string[], linhas: readonly Celula[][]): string {
  const celula = (valor: Celula): string => {
    if (valor === null) return '';
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
    return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n');
  return `﻿${conteudo}\r\n`;
}

export type TipoExportacao =
  'animais' | 'producao' | 'eventos' | 'tratamentos' | 'despesas' | 'resultado';

export function nomeArquivo(tipo: TipoExportacao, hoje: DataISO): string {
  return `meu-rebanho-${tipo}-${hoje}.csv`;
}

const data = (iso: DataISO | null) => (iso ? isoParaBR(iso) : null);

type AnimaisPorId = ReadonlyMap<string, Pick<Animal, 'nome' | 'brinco'>>;

const nomeDe = (porId: AnimaisPorId, id: string) => {
  const animal = porId.get(id);
  return animal ? identificacao(animal) : '(excluído)';
};

/** Todos os animais (inclusive os que saíram), em ordem de nome. */
export function csvAnimais(animais: readonly Animal[]): string {
  const porId = new Map(animais.map((a) => [a.id, a]));
  const linhas = [...animais].sort(compararNome).map((a) => {
    const r = a.resumo;
    return [
      identificacao(a),
      a.brinco,
      a.sexo === 'F' ? 'Fêmea' : 'Macho',
      a.raca || null,
      data(a.dataNascimento),
      ROTULO_STATUS[a.status],
      a.status === 'ativo' ? ROTULO_SITUACAO[r.situacao] : null,
      a.sexo === 'F' ? r.prenhe : null,
      a.sexo === 'F' ? r.numeroPartos : null,
      data(r.ultimoParto),
      data(r.ultimaCobertura),
      data(r.previsaoParto),
      data(r.previsaoSecagem),
      data(r.carenciaLeiteAte),
      a.maeId ? nomeDe(porId, a.maeId) : null,
      a.pai || null,
      a.origem === 'nascido' ? 'Nascido' : 'Comprado',
      data(a.dataSaida),
      a.motivoSaida || null,
      a.observacoes || null,
    ];
  });
  return gerarCSV(
    [
      'Nome',
      'Brinco',
      'Sexo',
      'Raça',
      'Nascimento',
      'Status',
      'Situação',
      'Prenhe',
      'Partos',
      'Último parto',
      'Último serviço',
      'Previsão de parto',
      'Previsão de secagem',
      'Carência de leite até',
      'Mãe',
      'Pai',
      'Origem',
      'Data de saída',
      'Motivo da saída',
      'Observações',
    ],
    linhas,
  );
}

/** Uma linha por vaca em cada ordenha, da mais antiga para a mais nova. */
export function csvProducao(producoes: readonly ProducaoOrdenha[], animais: AnimaisPorId): string {
  const ordenadas = [...producoes].sort(
    (a, b) =>
      a.data.localeCompare(b.data) || ORDENHAS.indexOf(a.ordenha) - ORDENHAS.indexOf(b.ordenha),
  );
  const linhas = ordenadas.flatMap((p) =>
    Object.entries(p.registros)
      .map(([id, r]) => ({ nome: nomeDe(animais, id), brinco: animais.get(id)?.brinco ?? '', r }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }))
      .map(({ nome, brinco, r }) => [
        isoParaBR(p.data),
        ROTULO_ORDENHA[p.ordenha],
        nome,
        brinco,
        r.litros,
        r.descartado,
      ]),
  );
  return gerarCSV(['Data', 'Ordenha', 'Animal', 'Brinco', 'Litros', 'Descartado'], linhas);
}

type DoAnimal = { animalId: string };

const porDataENome = <T extends DoAnimal & { data: DataISO }>(
  lista: readonly T[],
  animais: AnimaisPorId,
) =>
  [...lista].sort(
    (a, b) =>
      a.data.localeCompare(b.data) ||
      nomeDe(animais, a.animalId).localeCompare(nomeDe(animais, b.animalId), 'pt-BR'),
  );

export function csvEventos(
  eventos: readonly (EventoReprodutivo & DoAnimal)[],
  animais: AnimaisPorId,
): string {
  const linhas = porDataENome(eventos, animais).map((e) => [
    isoParaBR(e.data),
    nomeDe(animais, e.animalId),
    animais.get(e.animalId)?.brinco ?? '',
    ROTULO_EVENTO[e.tipo],
    e.touroSemen || null,
    e.responsavel || null,
    e.criaId ? nomeDe(animais, e.criaId) : null,
    e.observacoes || null,
  ]);
  return gerarCSV(
    ['Data', 'Animal', 'Brinco', 'Evento', 'Touro/sêmen', 'Responsável', 'Cria', 'Observações'],
    linhas,
  );
}

export function csvTratamentos(
  tratamentos: readonly (Tratamento & DoAnimal)[],
  animais: AnimaisPorId,
): string {
  const linhas = porDataENome(tratamentos, animais).map((t) => [
    isoParaBR(t.data),
    nomeDe(animais, t.animalId),
    animais.get(t.animalId)?.brinco ?? '',
    ROTULO_TRATAMENTO[t.tipo],
    t.produto,
    t.dose || null,
    t.via || null,
    t.carenciaLeiteDias,
    t.carenciaCarneDias,
    t.observacoes || null,
  ]);
  return gerarCSV(
    [
      'Data',
      'Animal',
      'Brinco',
      'Tipo',
      'Produto',
      'Dose',
      'Via',
      'Carência leite (dias)',
      'Carência carne (dias)',
      'Observações',
    ],
    linhas,
  );
}

const reais = (centavos: number) => Math.round(centavos) / 100;

/** Todas as despesas, da mais antiga para a mais nova. Valores em reais. */
export function csvDespesas(despesas: readonly Despesa[], animais: AnimaisPorId): string {
  const linhas = [...despesas]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((d) => [
      isoParaBR(d.data),
      ROTULO_CATEGORIA[d.categoria],
      d.descricao || null,
      reais(d.valor),
      d.quantidade,
      d.quantidade ? d.unidade : null,
      d.grupo === 'animais'
        ? d.animalIds.map((id) => nomeDe(animais, id)).join(', ')
        : ROTULO_GRUPO[d.grupo],
      d.porLitros ? 'Pelos litros' : d.grupo === 'animais' ? 'Partes iguais' : 'Cabeça-dia',
    ]);
  return gerarCSV(
    [
      'Data',
      'Categoria',
      'Descrição',
      'Valor (R$)',
      'Quantidade',
      'Unidade',
      'Para quem',
      'Rateio',
    ],
    linhas,
  );
}

/** Resultado de cada animal no período, da pior para a melhor margem. Valores em reais. */
export function csvResultadoAnimais(
  resultados: readonly ResultadoAnimal[],
  animais: AnimaisPorId,
): string {
  const linhas = [...resultados]
    .sort((a, b) => a.margem - b.margem)
    .map((r) => [
      nomeDe(animais, r.animalId),
      animais.get(r.animalId)?.brinco ?? '',
      r.litros,
      reais(r.receita),
      reais(r.valorDescartado),
      reais(r.custo),
      reais(r.margem),
    ]);
  return gerarCSV(
    [
      'Animal',
      'Brinco',
      'Litros',
      'Receita (R$)',
      'Leite descartado (R$)',
      'Custo rateado (R$)',
      'Margem (R$)',
    ],
    linhas,
  );
}
