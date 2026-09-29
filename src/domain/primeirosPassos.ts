import type { Animal } from './animal';

export type PassoInicial = {
  id: 'animais' | 'partos' | 'ordenha' | 'preco';
  titulo: string;
  detalhe: string;
  feito: boolean;
};

/**
 * Guia para a fazenda que está começando: aparece enquanto não houver nenhuma
 * vaca em lactação ativa (sem ela não há ordenha, alertas nem receita).
 * `null` quando o guia não é mais necessário.
 */
export function primeirosPassos(
  animais: readonly Pick<Animal, 'status' | 'resumo'>[],
  dono: boolean,
): PassoInicial[] | null {
  const ativos = animais.filter((a) => a.status === 'ativo');
  const lactacao = ativos.some((a) => a.resumo.situacao === 'lactacao');
  if (lactacao) return null;
  const passos: PassoInicial[] = [
    {
      id: 'animais',
      titulo: 'Cadastre seus animais',
      detalhe: 'Nome e brinco bastam; o resto dá para completar depois.',
      feito: ativos.length > 0,
    },
    {
      id: 'partos',
      titulo: 'Registre o último parto das vacas em lactação',
      detalhe: 'É o parto que coloca a vaca na ordenha e calcula os dias em lactação.',
      feito: false,
    },
    {
      id: 'ordenha',
      titulo: 'Lance a primeira ordenha',
      detalhe: 'Na aba Produção, os litros de todas as vacas de uma vez.',
      feito: false,
    },
  ];
  if (dono) {
    passos.push({
      id: 'preco',
      titulo: 'Cadastre o preço do leite',
      detalhe: 'Na aba Finanças, para ver receita, custo por litro e margem.',
      feito: false,
    });
  }
  return passos;
}
