import {
  calcularResultadoMes,
  despesasDoPeriodo,
  esquemaDespesa,
  formularioDaDespesa,
  montarDespesa,
  resumirDespesas,
  type Despesa,
} from '@/domain/despesas';

const despesa = (data: string, categoria: Despesa['categoria'], valor: number): Despesa => ({
  id: `${data}-${categoria}`,
  data,
  categoria,
  descricao: '',
  valor,
  quantidade: null,
  unidade: null,
  grupo: 'rebanho',
  animalIds: [],
  porLitros: false,
  tratamentoId: null,
});

describe('despesasDoPeriodo', () => {
  it('filtra pelas datas e ordena da mais recente', () => {
    const lista = [
      despesa('2026-08-31', 'racao', 1),
      despesa('2026-09-01', 'racao', 2),
      despesa('2026-09-30', 'energia', 3),
    ];
    expect(despesasDoPeriodo(lista, '2026-09-01', '2026-09-30').map((d) => d.valor)).toEqual([
      3, 2,
    ]);
  });
});

describe('resumirDespesas', () => {
  it('soma por categoria, do maior para o menor, e separa a alimentação', () => {
    const r = resumirDespesas([
      despesa('2026-09-01', 'racao', 300000),
      despesa('2026-09-02', 'energia', 50000),
      despesa('2026-09-03', 'volumoso', 100000),
      despesa('2026-09-04', 'racao', 20000),
    ]);
    expect(r.total).toBe(470000);
    expect(r.alimentacao).toBe(420000);
    expect(r.porCategoria.map((c) => c.categoria)).toEqual(['racao', 'volumoso', 'energia']);
  });
});

describe('calcularResultadoMes', () => {
  it('resultado, custo por litro, preço médio, % alimentação e equilíbrio', () => {
    const r = calcularResultadoMes({
      receita: 750000, // R$ 7.500
      litrosComPreco: 3000,
      litrosProduzidos: 3100,
      despesas: { total: 620000, alimentacao: 372000, porCategoria: [] },
      inicio: '2026-09-01',
      fim: '2026-09-30',
    });
    expect(r.resultado).toBe(130000);
    expect(r.precoMedio).toBe(2.5);
    expect(r.custoPorLitro).toBeCloseTo(2.0, 5);
    expect(r.percentualAlimentacao).toBe(60);
    // 6.200 / 2,50 / 30 dias
    expect(r.litrosDiaEquilibrio).toBe(83);
  });

  it('sem produção ou sem despesas: indicadores nulos', () => {
    const r = calcularResultadoMes({
      receita: 0,
      litrosComPreco: 0,
      litrosProduzidos: 0,
      despesas: { total: 0, alimentacao: 0, porCategoria: [] },
      inicio: '2026-09-01',
      fim: '2026-09-30',
    });
    expect([r.custoPorLitro, r.precoMedio, r.percentualAlimentacao, r.litrosDiaEquilibrio]).toEqual(
      [null, null, null, null],
    );
  });
});

describe('esquemaDespesa e montarDespesa', () => {
  const valido = {
    categoria: 'racao' as const,
    data: '2026-09-10',
    valor: 1234.56,
    descricao: ' Ração 22% ',
    quantidade: 1000,
    unidade: 'kg' as const,
    grupo: 'lactacao' as const,
    animalIds: ['x'],
    porLitros: true,
  };

  it('grava em centavos e limpa o que não se aplica ao grupo', () => {
    const r = esquemaDespesa.parse(valido);
    expect(montarDespesa(r)).toEqual({
      data: '2026-09-10',
      categoria: 'racao',
      descricao: 'Ração 22%',
      valor: 123456,
      quantidade: 1000,
      unidade: 'kg',
      grupo: 'lactacao',
      animalIds: [],
      porLitros: true,
      tratamentoId: null,
    });
    const rebanho = montarDespesa(esquemaDespesa.parse({ ...valido, grupo: 'rebanho' }));
    expect(rebanho.porLitros).toBe(false);
  });

  it('exige categoria, data, valor e animais quando o grupo é "animais"', () => {
    const r = esquemaDespesa.safeParse({
      ...valido,
      categoria: null,
      data: null,
      valor: null,
      grupo: 'animais',
      animalIds: [],
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        'animalIds',
        'categoria',
        'data',
        'valor',
      ]);
    }
  });

  it('formulário da despesa volta para reais', () => {
    const d = { ...despesa('2026-09-01', 'energia', 45990), id: 'd1' };
    expect(formularioDaDespesa(d).valor).toBe(459.9);
  });
});
