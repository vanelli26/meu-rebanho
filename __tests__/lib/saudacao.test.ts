import { saudacao } from '@/lib/saudacao';

describe('saudacao', () => {
  it.each([
    [5, 'Bom dia'],
    [11, 'Bom dia'],
    [12, 'Boa tarde'],
    [17, 'Boa tarde'],
    [18, 'Boa noite'],
    [0, 'Boa noite'],
    [4, 'Boa noite'],
  ])('às %ih diz "%s"', (hora, esperado) => {
    expect(saudacao(hora)).toBe(esperado);
  });
});
