import {
  calcularReceita,
  esquemaPrecoLeite,
  precoNaData,
  vigencias,
  type PrecoLeite,
} from '@/domain/precoLeite';

const preco = (inicio: string, valorLitro: number): PrecoLeite => ({
  id: inicio,
  inicio,
  valorLitro,
  observacao: '',
});
const precos = [preco('2026-08-01', 2.3), preco('2026-09-15', 2.5), preco('2026-07-01', 2.1)];

describe('vigencias', () => {
  it('o novo preço encerra o anterior na véspera', () => {
    expect(vigencias(precos).map((v) => [v.inicio, v.fim])).toEqual([
      ['2026-09-15', null],
      ['2026-08-01', '2026-09-14'],
      ['2026-07-01', '2026-07-31'],
    ]);
  });
});

describe('precoNaData', () => {
  it('pega o preço com o maior início até a data', () => {
    expect(precoNaData(precos, '2026-09-14')?.valorLitro).toBe(2.3);
    expect(precoNaData(precos, '2026-09-15')?.valorLitro).toBe(2.5);
    expect(precoNaData(precos, '2026-06-30')).toBeNull();
  });
});

describe('calcularReceita', () => {
  const producoes = [
    { data: '2026-06-30', totalLitros: 100, totalDescartado: 0 },
    { data: '2026-09-14', totalLitros: 100, totalDescartado: 10 },
    { data: '2026-09-15', totalLitros: 100.5, totalDescartado: 0 },
    { data: '2026-10-01', totalLitros: 999, totalDescartado: 0 },
  ];

  it('usa o preço vigente em cada dia e separa o descartado e o sem preço', () => {
    expect(calcularReceita(producoes, precos, '2026-06-01', '2026-09-30')).toEqual({
      litrosEntregues: 300.5,
      // 100 × 2,30 + 100,5 × 2,50
      receita: 23000 + 25125,
      litrosDescartados: 10,
      valorDescartado: 2300,
      litrosSemPreco: 100,
    });
  });
});

describe('esquemaPrecoLeite', () => {
  const valido = { inicio: '2026-09-01', valorLitro: 2.4735, observacao: '' };

  it('aceita até 4 casas', () => {
    expect(esquemaPrecoLeite.safeParse(valido).success).toBe(true);
    expect(esquemaPrecoLeite.safeParse({ ...valido, valorLitro: 2.3 }).success).toBe(true);
    expect(esquemaPrecoLeite.safeParse({ ...valido, valorLitro: 2.47351 }).success).toBe(false);
  });

  it('pega erro de digitação e campos vazios', () => {
    expect(esquemaPrecoLeite.safeParse({ ...valido, valorLitro: 250 }).success).toBe(false);
    const r = esquemaPrecoLeite.safeParse({ ...valido, inicio: null, valorLitro: null });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['inicio', 'valorLitro']);
  });
});
