import { diasEmLactacao, iepMedio, liberadaParaInseminar } from '@/domain/lactacao';

const lactacao = { situacao: 'lactacao' as const, ultimoParto: '2026-08-01', prenhe: false };

describe('diasEmLactacao', () => {
  it('conta os dias desde o último parto', () => {
    expect(diasEmLactacao(lactacao, '2026-09-28')).toBe(58);
    expect(diasEmLactacao(lactacao, '2026-08-01')).toBe(0);
  });

  it('é null fora da lactação', () => {
    expect(diasEmLactacao({ ...lactacao, situacao: 'seca' }, '2026-09-28')).toBeNull();
    expect(diasEmLactacao({ situacao: 'lactacao', ultimoParto: null }, '2026-09-28')).toBeNull();
  });
});

describe('liberadaParaInseminar', () => {
  const config = { periodoVoluntarioEspera: 45 };

  it('libera a partir do período voluntário de espera', () => {
    expect(liberadaParaInseminar(lactacao, '2026-09-14', config)).toBe(false);
    expect(liberadaParaInseminar(lactacao, '2026-09-15', config)).toBe(true);
  });

  it('não libera prenhe ou seca', () => {
    expect(liberadaParaInseminar({ ...lactacao, prenhe: true }, '2026-12-01', config)).toBe(false);
    expect(liberadaParaInseminar({ ...lactacao, situacao: 'seca' }, '2026-12-01', config)).toBe(
      false,
    );
  });
});

describe('iepMedio', () => {
  it('média arredondada dos intervalos', () => {
    expect(iepMedio([380, 395])).toBe(388);
    expect(iepMedio([])).toBeNull();
  });
});
