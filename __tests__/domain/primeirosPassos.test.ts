import type { ResumoAnimal } from '@/domain/animal';
import { primeirosPassos } from '@/domain/primeirosPassos';

const animal = (situacao: ResumoAnimal['situacao'], status: 'ativo' | 'vendido' = 'ativo') => ({
  status,
  resumo: { situacao } as ResumoAnimal,
});

describe('primeirosPassos', () => {
  it('fazenda vazia: todos os passos a fazer, com o preço só para o dono', () => {
    const passos = primeirosPassos([], true);
    expect(passos?.map((p) => [p.id, p.feito])).toEqual([
      ['animais', false],
      ['partos', false],
      ['ordenha', false],
      ['preco', false],
    ]);
    expect(primeirosPassos([], false)?.map((p) => p.id)).not.toContain('preco');
  });

  it('com animais, mas sem vaca em lactação: primeiro passo feito', () => {
    expect(primeirosPassos([animal('novilha')], true)?.[0].feito).toBe(true);
    // Vaca em lactação que já saiu não conta.
    expect(primeirosPassos([animal('lactacao', 'vendido')], true)?.[0].feito).toBe(false);
  });

  it('com vaca em lactação: o guia some', () => {
    expect(primeirosPassos([animal('lactacao')], true)).toBeNull();
  });
});
