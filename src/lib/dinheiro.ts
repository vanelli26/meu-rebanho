/**
 * Dinheiro. Totais e despesas em **centavos inteiros** (evita somas como
 * 0,30000001). O preço do litro é em reais com até 4 casas, porque o laticínio
 * paga frações de centavo (ex.: R$ 2,4735).
 */

const milhar = (inteiro: string) => inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Centavos → "R$ 1.234,56" (negativo: "−R$ 12,00"). */
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '−' : '';
  const abs = Math.abs(Math.round(centavos));
  const inteiro = milhar(String(Math.floor(abs / 100)));
  const resto = String(abs % 100).padStart(2, '0');
  return `${sinal}R$ ${inteiro},${resto}`;
}

/** Centavos → "R$ 1.235", para números grandes em destaque. */
export function formatarReaisCurto(centavos: number): string {
  const sinal = centavos < 0 ? '−' : '';
  return `${sinal}R$ ${milhar(String(Math.round(Math.abs(centavos) / 100)))}`;
}

/** Preço do litro em reais → "R$ 2,50" ou "R$ 2,4735" (mínimo 2, máximo 4 casas). */
export function formatarPrecoLitro(valor: number): string {
  const [inteiro, decimais = ''] = (Math.round(valor * 10000) / 10000).toFixed(4).split('.');
  const casas = decimais.replace(/0+$/, '').padEnd(2, '0');
  return `R$ ${milhar(inteiro)},${casas}`;
}

/** Reais (número) → centavos inteiros. */
export function reaisParaCentavos(reais: number): number {
  return Math.round(reais * 100);
}
