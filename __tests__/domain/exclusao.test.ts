import { planoExclusao, resumoExclusao } from '@/domain/exclusao';

describe('planoExclusao', () => {
  const animais = [
    { id: 'mae', maeId: null },
    { id: 'x', maeId: 'mae' },
    { id: 'filho', maeId: 'x' },
  ];
  const eventos = new Map([
    [
      'mae',
      [
        { id: 'p1', criaId: 'x' },
        { id: 'p0', criaId: 'outra' },
      ],
    ],
    [
      'x',
      [
        { id: 'e1', criaId: null },
        { id: 'e2', criaId: 'filho' },
      ],
    ],
  ]);
  const tratamentos = new Map([['x', [{ id: 't1' }]]]);
  const producoes: { registros: Record<string, { litros: number; descartado: boolean }> }[] = [
    { registros: { x: { litros: 10, descartado: false } } },
    { registros: { mae: { litros: 8, descartado: false } } },
  ];

  it('junta eventos, tratamentos, crias, o parto da mãe e as ordenhas', () => {
    expect(planoExclusao(animais[1], animais, eventos, tratamentos, producoes)).toEqual({
      eventoIds: ['e1', 'e2'],
      tratamentoIds: ['t1'],
      filhoIds: ['filho'],
      partoDaMae: { animalId: 'mae', eventoId: 'p1' },
      ordenhas: 1,
    });
  });

  it('animal cadastrado por engano, sem nada ligado', () => {
    const plano = planoExclusao({ id: 'novo', maeId: null }, animais, eventos, tratamentos, []);
    expect(plano).toEqual({
      eventoIds: [],
      tratamentoIds: [],
      filhoIds: [],
      partoDaMae: null,
      ordenhas: 0,
    });
    expect(resumoExclusao(plano)).toBe('');
  });

  it('resumo do que será apagado', () => {
    expect(
      resumoExclusao({
        eventoIds: ['a', 'b'],
        tratamentoIds: ['t'],
        filhoIds: [],
        partoDaMae: null,
        ordenhas: 0,
      }),
    ).toBe('Também serão apagados 2 eventos e 1 tratamento.');
  });
});
