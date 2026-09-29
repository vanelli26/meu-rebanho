import {
  brParaISO,
  diasEntre,
  ehDataISO,
  idadeTexto,
  isoParaBR,
  isoParaDiaMes,
  limitesDoMes,
  mascaraDataBR,
  mesDe,
  nomeDoMes,
  paraDataISO,
  somarDias,
  somarMeses,
} from '@/lib/datas';

describe('datas', () => {
  it('converte Date local para ISO', () => {
    expect(paraDataISO(new Date(2026, 8, 7))).toBe('2026-09-07');
  });

  it('converte ISO para BR', () => {
    expect(isoParaBR('2026-09-27')).toBe('27/09/2026');
    expect(isoParaBR('2026-02-30')).toBe('');
    expect(isoParaBR('lixo')).toBe('');
  });

  it('converte BR para ISO e rejeita datas inexistentes', () => {
    expect(brParaISO('27/09/2026')).toBe('2026-09-27');
    expect(brParaISO('29/02/2024')).toBe('2024-02-29');
    expect(brParaISO('29/02/2026')).toBeNull();
    expect(brParaISO('27/9/2026')).toBeNull();
    expect(brParaISO('')).toBeNull();
  });

  it('aplica máscara dd/MM/yyyy', () => {
    expect(mascaraDataBR('2')).toBe('2');
    expect(mascaraDataBR('270')).toBe('27/0');
    expect(mascaraDataBR('27092026')).toBe('27/09/2026');
    expect(mascaraDataBR('27/09/20269')).toBe('27/09/2026');
  });
});

describe('somarDias, diasEntre, ehDataISO e isoParaDiaMes', () => {
  it('soma dias atravessando meses e anos', () => {
    expect(somarDias('2026-12-30', 3)).toBe('2027-01-02');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('conta dias corridos', () => {
    expect(diasEntre('2026-09-01', '2026-09-28')).toBe(27);
    expect(diasEntre('2026-09-28', '2026-09-01')).toBe(-27);
  });

  it('valida datas ISO e formata dia/mês', () => {
    expect(ehDataISO('2026-02-28')).toBe(true);
    expect(ehDataISO('2026-02-30')).toBe(false);
    expect(isoParaDiaMes('2026-09-05')).toBe('05/09');
  });
});

describe('idadeTexto', () => {
  it('usa dias, meses ou anos e meses', () => {
    expect(idadeTexto('2026-09-27', '2026-09-28')).toBe('1 dia');
    expect(idadeTexto('2026-09-10', '2026-09-28')).toBe('18 dias');
    expect(idadeTexto('2026-04-28', '2026-09-28')).toBe('5 meses');
    expect(idadeTexto('2025-09-28', '2026-09-28')).toBe('1 ano');
    expect(idadeTexto('2024-06-01', '2026-09-28')).toBe('2 anos e 3 meses');
  });
});

describe('meses', () => {
  it('mesDe, limites, soma e nome', () => {
    expect(mesDe('2026-09-29')).toBe('2026-09');
    expect(limitesDoMes('2026-02')).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' });
    expect(somarMeses('2026-01', -1)).toBe('2025-12');
    expect(nomeDoMes('2026-09')).toBe('setembro de 2026');
  });
});
