import {
  esquemaLitros,
  idOrdenha,
  montarProducao,
  ordenhaSugerida,
  producaoDoAnimal,
  resumoProducao,
  type ProducaoOrdenha,
} from '@/domain/producao';

describe('idOrdenha', () => {
  it('junta data e ordenha', () => {
    expect(idOrdenha('2026-09-27', 'manha')).toBe('2026-09-27_manha');
  });
});

describe('montarProducao', () => {
  it('ignora vazios e zeros e separa os descartados dos totais', () => {
    const p = montarProducao('2026-09-27', 'manha', {
      a: { litros: 12.1, descartado: false },
      b: { litros: 10.2, descartado: false },
      c: { litros: 8, descartado: true },
      d: { litros: null, descartado: false },
      e: { litros: 0, descartado: false },
    });
    expect(p).toEqual({
      data: '2026-09-27',
      ordenha: 'manha',
      registros: {
        a: { litros: 12.1, descartado: false },
        b: { litros: 10.2, descartado: false },
        c: { litros: 8, descartado: true },
      },
      totalLitros: 22.3,
      totalDescartado: 8,
    });
  });
});

describe('resumoProducao', () => {
  const p = (data: string, totalLitros: number) => ({ data, totalLitros });

  it('soma as ordenhas de ontem e faz a média dos 7 dias anteriores com lançamento', () => {
    const r = resumoProducao(
      [
        p('2026-09-28', 999), // hoje: fora
        p('2026-09-27', 100),
        p('2026-09-27', 80.5),
        p('2026-09-25', 200),
        p('2026-09-21', 150),
        p('2026-09-20', 999), // 8 dias atrás: fora
      ],
      '2026-09-28',
    );
    expect(r.ontem).toBe(180.5);
    expect(r.media7Dias).toBe(176.8);
  });

  it('sem lançamentos: null', () => {
    expect(resumoProducao([], '2026-09-28')).toEqual({ ontem: null, media7Dias: null });
  });
});

describe('producaoDoAnimal', () => {
  it('lista as ordenhas da vaca, da mais recente para a mais antiga', () => {
    const producoes: ProducaoOrdenha[] = [
      {
        id: '1',
        data: '2026-09-26',
        ordenha: 'manha',
        registros: { a: { litros: 10, descartado: false } },
        totalLitros: 10,
        totalDescartado: 0,
      },
      {
        id: '2',
        data: '2026-09-26',
        ordenha: 'tarde',
        registros: { a: { litros: 8, descartado: true }, b: { litros: 5, descartado: false } },
        totalLitros: 5,
        totalDescartado: 8,
      },
      {
        id: '3',
        data: '2026-09-27',
        ordenha: 'manha',
        registros: { b: { litros: 7, descartado: false } },
        totalLitros: 7,
        totalDescartado: 0,
      },
    ];
    expect(producaoDoAnimal(producoes, 'a')).toEqual([
      { data: '2026-09-26', ordenha: 'tarde', litros: 8, descartado: true },
      { data: '2026-09-26', ordenha: 'manha', litros: 10, descartado: false },
    ]);
  });
});

describe('ordenhaSugerida e esquemaLitros', () => {
  it('manhã antes do meio-dia', () => {
    expect(ordenhaSugerida(5)).toBe('manha');
    expect(ordenhaSugerida(15)).toBe('tarde');
  });

  it('limita os litros por ordenha', () => {
    expect(esquemaLitros.safeParse(null).success).toBe(true);
    expect(esquemaLitros.safeParse(25.5).success).toBe(true);
    expect(esquemaLitros.safeParse(250).success).toBe(false);
  });
});
