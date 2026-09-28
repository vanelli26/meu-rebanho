import { brParaISO, isoParaBR, mascaraDataBR, paraDataISO } from '@/lib/datas';

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
