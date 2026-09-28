/**
 * Converte texto digitado em pt-BR (vírgula decimal) em número.
 * Aceita ponto também, pois alguns teclados numéricos só oferecem ponto.
 * Retorna `null` para vazio ou inválido.
 */
export function textoParaNumero(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '' || !/^\d*\.?\d*$/.test(limpo) || limpo === '.') return null;
  return Number(limpo);
}

/** Formata número com vírgula decimal, sem separador de milhar. */
export function numeroParaTexto(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '';
  const fixo = Number.isInteger(valor) ? String(valor) : valor.toFixed(casas);
  return fixo.replace('.', ',');
}

/** Mantém só dígitos e uma vírgula enquanto o usuário digita. */
export function mascaraDecimal(texto: string): string {
  const normalizado = texto.replace('.', ',').replace(/[^\d,]/g, '');
  const [inteiro, ...resto] = normalizado.split(',');
  return resto.length ? `${inteiro},${resto.join('')}` : inteiro;
}
