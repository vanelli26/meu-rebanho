import { mascaraDecimal, numeroParaTexto, textoParaNumero } from '@/lib/numeros';

describe('numeros', () => {
  it('lê vírgula e ponto decimal', () => {
    expect(textoParaNumero('12,5')).toBe(12.5);
    expect(textoParaNumero('12.5')).toBe(12.5);
    expect(textoParaNumero(' 8 ')).toBe(8);
    expect(textoParaNumero(',5')).toBe(0.5);
  });

  it('rejeita vazio e inválido', () => {
    expect(textoParaNumero('')).toBeNull();
    expect(textoParaNumero(',')).toBeNull();
    expect(textoParaNumero('1,2,3')).toBeNull();
    expect(textoParaNumero('-3')).toBeNull();
    expect(textoParaNumero('abc')).toBeNull();
  });

  it('formata com vírgula', () => {
    expect(numeroParaTexto(12.5)).toBe('12,5');
    expect(numeroParaTexto(12)).toBe('12');
    expect(numeroParaTexto(12.345, 2)).toBe('12,35');
    expect(numeroParaTexto(null)).toBe('');
  });

  it('mascara entrada decimal', () => {
    expect(mascaraDecimal('12.5')).toBe('12,5');
    expect(mascaraDecimal('1a2,5,')).toBe('12,5');
    expect(mascaraDecimal('')).toBe('');
  });
});
