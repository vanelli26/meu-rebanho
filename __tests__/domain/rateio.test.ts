import type { Despesa } from '@/domain/despesas';
import { montarProducao } from '@/domain/producao';
import {
  presenteNaData,
  ratearDespesas,
  resultadoPorAnimal,
  situacaoNaData,
} from '@/domain/rateio';
import type { TipoEvento } from '@/domain/reproducao';

const ev = (data: string, tipo: TipoEvento) => ({ data, tipo });

const animal = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  sexo: 'F' as const,
  dataNascimento: '2020-01-01',
  dataEntrada: null,
  status: 'ativo' as const,
  dataSaida: null,
  ...extra,
});

const despesa = (valor: number, extra: Partial<Despesa> = {}) => ({
  data: '2026-09-05',
  categoria: 'volumoso' as const,
  valor,
  grupo: 'rebanho' as const,
  animalIds: [] as string[],
  porLitros: false,
  ...extra,
});

const SET = { inicio: '2026-09-01', fim: '2026-09-30' };

describe('presenteNaData e situacaoNaData', () => {
  it('entrada, nascimento e saída', () => {
    expect(presenteNaData(animal('a', { dataEntrada: '2026-09-16' }), '2026-09-15')).toBe(false);
    expect(presenteNaData(animal('a', { dataEntrada: '2026-09-16' }), '2026-09-16')).toBe(true);
    const vendida = animal('a', { status: 'vendido', dataSaida: '2026-09-11' });
    expect(presenteNaData(vendida, '2026-09-10')).toBe(true);
    expect(presenteNaData(vendida, '2026-09-11')).toBe(false);
  });

  it('lactação a partir do parto e seca após a secagem', () => {
    const eventos = [
      ev('2026-09-10', 'parto'),
      ev('2025-08-01', 'parto'),
      ev('2026-06-01', 'secagem'),
    ];
    expect(situacaoNaData(animal('a'), eventos, '2026-09-09')).toBe('seca');
    expect(situacaoNaData(animal('a'), eventos, '2026-09-10')).toBe('lactacao');
    expect(situacaoNaData(animal('a', { dataNascimento: '2026-03-01' }), [], '2026-09-10')).toBe(
      'bezerra',
    );
  });
});

describe('ratearDespesas', () => {
  const vacas = [
    animal('a'), // novilha o mês todo
    animal('b', { dataEntrada: '2026-09-16' }), // 15 dias
    animal('c'), // lactação a partir de 21/09 (10 dias)
  ];
  const eventos = new Map([['c', [ev('2026-09-21', 'parto')]]]);
  const base = { animais: vacas, eventosPorAnimal: eventos, producoes: [], ...SET };

  it('rebanho: por cabeça-dia', () => {
    // 30 + 15 + 30 = 75 cabeças-dia; R$ 750 → R$ 10 por cabeça-dia.
    const r = ratearDespesas({ ...base, despesas: [despesa(75000)] });
    expect(r.porAnimal.get('a')?.total).toBeCloseTo(30000);
    expect(r.porAnimal.get('b')?.total).toBeCloseTo(15000);
    expect(r.porAnimal.get('c')?.total).toBeCloseTo(30000);
    expect(r.naoRateado).toBe(0);
  });

  it('grupo lactação só pega os dias em lactação; grupo vazio fica sem rateio', () => {
    const r = ratearDespesas({
      ...base,
      despesas: [
        despesa(10000, { grupo: 'lactacao', categoria: 'racao' }),
        despesa(5000, { grupo: 'secas' }),
      ],
    });
    expect(r.porAnimal.get('c')?.porCategoria).toEqual({ racao: 10000 });
    expect(r.porAnimal.has('a')).toBe(false);
    expect(r.naoRateado).toBe(5000);
  });

  it('animais escolhidos: partes iguais', () => {
    const r = ratearDespesas({
      ...base,
      despesas: [
        despesa(3000, { grupo: 'animais', animalIds: ['a', 'b'], categoria: 'tratamentos' }),
      ],
    });
    expect(r.porAnimal.get('a')?.total).toBe(1500);
    expect(r.porAnimal.get('b')?.total).toBe(1500);
  });

  it('lactação pelos litros, com volta para cabeça-dia sem produção', () => {
    const duas = [animal('x'), animal('y')];
    const ev2 = new Map([
      ['x', [ev('2026-01-01', 'parto')]],
      ['y', [ev('2026-01-01', 'parto')]],
    ]);
    const producoes = [
      montarProducao('2026-09-10', 'manha', {
        x: { litros: 30, descartado: false },
        y: { litros: 10, descartado: true },
      }),
    ];
    const racao = despesa(4000, { grupo: 'lactacao', categoria: 'racao', porLitros: true });
    const r = ratearDespesas({
      ...SET,
      animais: duas,
      eventosPorAnimal: ev2,
      producoes,
      despesas: [racao],
    });
    expect(r.porAnimal.get('x')?.total).toBeCloseTo(3000);
    expect(r.porAnimal.get('y')?.total).toBeCloseTo(1000);

    const semLeite = ratearDespesas({
      ...SET,
      animais: duas,
      eventosPorAnimal: ev2,
      producoes: [],
      despesas: [racao],
    });
    expect(semLeite.porAnimal.get('x')?.total).toBeCloseTo(2000);
  });

  it('ignora despesas fora do período', () => {
    const r = ratearDespesas({ ...base, despesas: [despesa(1000, { data: '2026-10-01' })] });
    expect(r.porAnimal.size).toBe(0);
  });
});

describe('resultadoPorAnimal', () => {
  it('receita pelo preço vigente, descarte à parte e margem', () => {
    const rateio = {
      porAnimal: new Map([['x', { total: 5000, porCategoria: { racao: 5000 } }]]),
      naoRateado: 0,
    };
    const producoes = [
      montarProducao('2026-09-10', 'manha', { x: { litros: 20, descartado: false } }),
      montarProducao('2026-09-20', 'manha', {
        x: { litros: 10, descartado: true },
        y: { litros: 8, descartado: false },
      }),
    ];
    const precos = [
      { id: '2026-09-01', inicio: '2026-09-01', valorLitro: 2, observacao: '' },
      { id: '2026-09-15', inicio: '2026-09-15', valorLitro: 2.5, observacao: '' },
    ];
    const r = resultadoPorAnimal({ rateio, producoes, precos, ...SET });
    const x = r.find((a) => a.animalId === 'x');
    expect(x).toMatchObject({
      litros: 30,
      receita: 4000,
      valorDescartado: 2500,
      custo: 5000,
      margem: -1000,
    });
    expect(r.find((a) => a.animalId === 'y')).toMatchObject({
      receita: 2000,
      custo: 0,
      margem: 2000,
    });
  });
});
