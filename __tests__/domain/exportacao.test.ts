import type { Animal } from '@/domain/animal';
import {
  csvAnimais,
  csvEventos,
  csvProducao,
  csvTratamentos,
  gerarCSV,
  nomeArquivo,
} from '@/domain/exportacao';
import { montarProducao } from '@/domain/producao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';

const linhas = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

function animal(id: string, nome: string, brinco: string, extra: Partial<Animal> = {}): Animal {
  const dados = {
    brinco,
    nome,
    raca: 'Holandesa',
    sexo: 'F' as const,
    dataNascimento: '2022-03-05',
    maeId: null,
    pai: '',
    origem: 'nascido' as const,
    dataEntrada: null,
    status: 'ativo' as const,
    dataSaida: null,
    motivoSaida: '',
    observacoes: '',
    ...extra,
  };
  return {
    id,
    ...dados,
    resumo: calcularResumo(dados, [], CONFIGURACOES_PADRAO, new Date(2026, 8, 28)),
  };
}

describe('gerarCSV', () => {
  it('usa ponto e vírgula, vírgula decimal, Sim/Não e BOM', () => {
    const csv = gerarCSV(['A', 'B', 'C', 'D'], [[1.5, true, null, 'x']]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(linhas(csv)).toEqual(['A;B;C;D', '1,5;Sim;;x']);
  });

  it('protege textos com separador, aspas ou quebra de linha', () => {
    expect(linhas(gerarCSV(['A'], [['a;b'], ['diz "oi"']]))).toEqual([
      'A',
      '"a;b"',
      '"diz ""oi"""',
    ]);
  });
});

describe('nomeArquivo', () => {
  it('inclui o tipo e a data', () => {
    expect(nomeArquivo('producao', '2026-09-28')).toBe('meu-rebanho-producao-2026-09-28.csv');
  });
});

const mimosa = animal('a1', 'Mimosa', '12');
const estrela = animal('a2', 'Estrela', '7', { maeId: 'a1' });
const porId = new Map([mimosa, estrela].map((a) => [a.id, a]));

describe('csvAnimais', () => {
  it('uma linha por animal em ordem de nome, com a mãe pelo nome', () => {
    const [cabecalho, primeira, segunda] = linhas(csvAnimais([mimosa, estrela]));
    expect(cabecalho.split(';').slice(0, 3)).toEqual(['Nome', 'Brinco', 'Sexo']);
    expect(primeira.split(';').slice(0, 5)).toEqual([
      'Estrela',
      '7',
      'Fêmea',
      'Holandesa',
      '05/03/2022',
    ]);
    expect(primeira.split(';')[14]).toBe('Mimosa');
    expect(segunda.startsWith('Mimosa;12;')).toBe(true);
  });
});

describe('csvProducao', () => {
  it('uma linha por vaca e ordenha, em ordem de data e ordenha', () => {
    const producoes = [
      {
        id: '2026-09-28_tarde',
        ...montarProducao('2026-09-28', 'tarde', { a1: { litros: 9, descartado: true } }),
      },
      {
        id: '2026-09-28_manha',
        ...montarProducao('2026-09-28', 'manha', {
          a1: { litros: 10.5, descartado: false },
          a2: { litros: 8, descartado: false },
        }),
      },
    ];
    expect(linhas(csvProducao(producoes, porId))).toEqual([
      'Data;Ordenha;Animal;Brinco;Litros;Descartado',
      '28/09/2026;Manhã;Estrela;7;8;Não',
      '28/09/2026;Manhã;Mimosa;12;10,5;Não',
      '28/09/2026;Tarde;Mimosa;12;9;Sim',
    ]);
  });
});

describe('csvEventos e csvTratamentos', () => {
  it('eventos em ordem de data, com a cria pelo nome', () => {
    const eventos = [
      {
        id: 'e2',
        animalId: 'a1',
        data: '2026-09-01',
        tipo: 'parto' as const,
        touroSemen: '',
        responsavel: '',
        criaId: 'a2',
        observacoes: '',
      },
      {
        id: 'e1',
        animalId: 'a1',
        data: '2025-11-20',
        tipo: 'inseminacao' as const,
        touroSemen: 'Touro X',
        responsavel: 'João',
        criaId: null,
        observacoes: '',
      },
    ];
    expect(linhas(csvEventos(eventos, porId)).slice(1)).toEqual([
      '20/11/2025;Mimosa;12;Inseminação;Touro X;João;;',
      '01/09/2026;Mimosa;12;Parto;;;Estrela;',
    ]);
  });

  it('tratamentos com as carências', () => {
    const tratamentos = [
      {
        id: 't1',
        animalId: 'a2',
        data: '2026-09-10',
        tipo: 'antibiotico' as const,
        produto: 'Mastite Plus',
        dose: '10 mL',
        via: 'Intramamária',
        carenciaLeiteDias: 4,
        carenciaCarneDias: 7,
        observacoes: '',
        despesaId: null,
      },
    ];
    expect(linhas(csvTratamentos(tratamentos, porId))[1]).toBe(
      '10/09/2026;Estrela;7;Antibiótico;Mastite Plus;10 mL;Intramamária;4;7;',
    );
  });
});
