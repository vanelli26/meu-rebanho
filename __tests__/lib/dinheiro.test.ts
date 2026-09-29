import {
  formatarPrecoLitro,
  formatarReais,
  formatarReaisCurto,
  reaisParaCentavos,
} from '@/lib/dinheiro';

describe('dinheiro', () => {
  it('formata centavos em reais com milhar e vírgula', () => {
    expect(formatarReais(123456)).toBe('R$ 1.234,56');
    expect(formatarReais(5)).toBe('R$ 0,05');
    expect(formatarReais(-1200)).toBe('−R$ 12,00');
    expect(formatarReais(123456789)).toBe('R$ 1.234.567,89');
  });

  it('formato curto arredonda para reais', () => {
    expect(formatarReaisCurto(123456)).toBe('R$ 1.235');
  });

  it('preço do litro com 2 a 4 casas', () => {
    expect(formatarPrecoLitro(2.5)).toBe('R$ 2,50');
    expect(formatarPrecoLitro(2.4735)).toBe('R$ 2,4735');
    expect(formatarPrecoLitro(2.47)).toBe('R$ 2,47');
  });

  it('reais para centavos sem erro de ponto flutuante', () => {
    expect(reaisParaCentavos(0.1 + 0.2)).toBe(30);
    expect(reaisParaCentavos(19.99)).toBe(1999);
  });
});
