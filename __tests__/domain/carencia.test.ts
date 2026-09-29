import {
  carenciaCarneAte,
  carenciaLeiteAte,
  emCarenciaLeite,
  emCarenciaLeiteNaData,
  esquemaTratamento,
  fimCarencia,
  montarTratamento,
  ordenarTratamentos,
} from '@/domain/carencia';

const t = (data: string, leite: number, carne = 0) => ({
  data,
  carenciaLeiteDias: leite,
  carenciaCarneDias: carne,
});

describe('fimCarencia', () => {
  it('soma os dias à data do tratamento', () => {
    expect(fimCarencia('2026-09-28', 4)).toBe('2026-10-02');
  });

  it('sem dias de carência: null', () => {
    expect(fimCarencia('2026-09-28', 0)).toBeNull();
  });
});

describe('carenciaLeiteAte e carenciaCarneAte', () => {
  it('pega o maior fim de carência entre os tratamentos', () => {
    const lista = [t('2026-09-01', 3, 30), t('2026-09-20', 2, 0), t('2026-09-10', 0, 10)];
    expect(carenciaLeiteAte(lista)).toBe('2026-09-22');
    expect(carenciaCarneAte(lista)).toBe('2026-10-01');
  });

  it('sem tratamentos com carência: null', () => {
    expect(carenciaLeiteAte([])).toBeNull();
    expect(carenciaLeiteAte([t('2026-09-01', 0)])).toBeNull();
  });
});

describe('emCarenciaLeite', () => {
  it('inclui o último dia da carência', () => {
    expect(emCarenciaLeite('2026-09-28', '2026-09-28')).toBe(true);
    expect(emCarenciaLeite('2026-09-28', '2026-09-29')).toBe(false);
    expect(emCarenciaLeite(null, '2026-09-28')).toBe(false);
  });
});

describe('emCarenciaLeiteNaData', () => {
  const lista = [t('2026-09-10', 3), t('2026-09-20', 0)];

  it('cobre do dia da aplicação até o fim da carência', () => {
    expect(emCarenciaLeiteNaData(lista, '2026-09-10')).toBe(true);
    expect(emCarenciaLeiteNaData(lista, '2026-09-13')).toBe(true);
    expect(emCarenciaLeiteNaData(lista, '2026-09-14')).toBe(false);
  });

  it('ignora ordenhas anteriores ao tratamento', () => {
    expect(emCarenciaLeiteNaData(lista, '2026-09-09')).toBe(false);
  });
});

describe('ordenarTratamentos', () => {
  it('mais recente primeiro', () => {
    const lista = [{ data: '2026-01-01' }, { data: '2026-03-01' }, { data: '2026-02-01' }];
    expect(ordenarTratamentos(lista).map((x) => x.data)).toEqual([
      '2026-03-01',
      '2026-02-01',
      '2026-01-01',
    ]);
  });
});

describe('esquemaTratamento', () => {
  const valido = {
    animalIds: ['a1', 'a2'],
    tipo: 'antibiotico' as const,
    data: '2026-09-28',
    produto: ' Mastite Plus ',
    dose: '10 mL',
    via: 'Intramamária',
    carenciaLeiteDias: 4,
    carenciaCarneDias: 7,
    observacoes: '',
    custo: null,
  };

  it('aceita e monta o tratamento', () => {
    const r = esquemaTratamento.safeParse(valido);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(montarTratamento(r.data)).toEqual({
        data: '2026-09-28',
        tipo: 'antibiotico',
        produto: 'Mastite Plus',
        dose: '10 mL',
        via: 'Intramamária',
        carenciaLeiteDias: 4,
        carenciaCarneDias: 7,
        observacoes: '',
        despesaId: null,
      });
    }
  });

  it('exige animais, tipo, data, produto e dias de carência', () => {
    const r = esquemaTratamento.safeParse({
      ...valido,
      animalIds: [],
      tipo: null,
      data: null,
      produto: ' ',
      carenciaLeiteDias: null,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        'animalIds',
        'carenciaLeiteDias',
        'data',
        'produto',
        'tipo',
      ]);
    }
  });

  it('rejeita dias fracionados ou exagerados', () => {
    expect(esquemaTratamento.safeParse({ ...valido, carenciaLeiteDias: 1.5 }).success).toBe(false);
    expect(esquemaTratamento.safeParse({ ...valido, carenciaCarneDias: 400 }).success).toBe(false);
  });
});
