import {
  brincoDisponivel,
  buscarAnimais,
  chaveBrinco,
  compararBrinco,
  esquemaAnimal,
  FORMULARIO_ANIMAL_VAZIO,
  formularioDoAnimal,
  identificacao,
  montarDadosAnimal,
  situacaoAtual,
  situacaoSemParto,
} from '@/domain/animal';

const hoje = new Date(2026, 8, 28);

describe('chaveBrinco e brincoDisponivel', () => {
  it('ignora espaços, caixa e zeros à esquerda', () => {
    expect(chaveBrinco(' 0123 ')).toBe('123');
    expect(chaveBrinco('ab 12')).toBe('AB12');
  });

  it('detecta brinco repetido, exceto no próprio animal', () => {
    const animais = [
      { id: 'a1', brinco: '123' },
      { id: 'a2', brinco: 'B7' },
    ];
    expect(brincoDisponivel('0123', animais)).toBe(false);
    expect(brincoDisponivel('b7', animais)).toBe(false);
    expect(brincoDisponivel('123', animais, 'a1')).toBe(true);
    expect(brincoDisponivel('124', animais)).toBe(true);
  });
});

describe('situacaoSemParto e situacaoAtual', () => {
  it('macho, bezerra até 12 meses e novilha depois', () => {
    expect(situacaoSemParto('M', '2026-01-01', hoje)).toBe('macho');
    expect(situacaoSemParto('F', '2026-01-01', hoje)).toBe('bezerra');
    expect(situacaoSemParto('F', '2025-09-28', hoje)).toBe('novilha');
    expect(situacaoSemParto('F', '2025-09-29', hoje)).toBe('bezerra');
    expect(situacaoSemParto('F', null, hoje)).toBe('novilha');
  });

  it('bezerra gravada vira novilha ao completar a idade, sem nova gravação', () => {
    const animal = {
      sexo: 'F' as const,
      dataNascimento: '2025-08-01',
      resumo: { situacao: 'bezerra' as const },
    };
    expect(situacaoAtual(animal as Parameters<typeof situacaoAtual>[0], hoje)).toBe('novilha');
  });

  it('mantém as demais situações do resumo', () => {
    const animal = { sexo: 'F', dataNascimento: null, resumo: { situacao: 'seca' } };
    expect(situacaoAtual(animal as Parameters<typeof situacaoAtual>[0], hoje)).toBe('seca');
  });
});

describe('buscarAnimais', () => {
  const animais = [
    { brinco: '10', nome: 'Estrela' },
    { brinco: '2', nome: 'Mimosa' },
    { brinco: '102', nome: 'Pérola' },
    { brinco: '31', nome: 'Malhada 10' },
  ];

  it('sem termo, ordena pelo brinco em ordem natural', () => {
    expect(buscarAnimais(animais, '').map((a) => a.brinco)).toEqual(['2', '10', '31', '102']);
  });

  it('busca por brinco (prefixo primeiro) e por nome sem acento', () => {
    expect(buscarAnimais(animais, '10').map((a) => a.brinco)).toEqual(['10', '102', '31']);
    expect(buscarAnimais(animais, 'perola').map((a) => a.nome)).toEqual(['Pérola']);
    expect(buscarAnimais(animais, ' MIMO ').map((a) => a.nome)).toEqual(['Mimosa']);
  });

  it('compararBrinco usa ordem natural', () => {
    expect(compararBrinco('9', '10')).toBeLessThan(0);
  });
});

describe('identificacao', () => {
  it('mostra brinco e nome quando houver', () => {
    expect(identificacao({ brinco: '12', nome: 'Mimosa' })).toBe('12 · Mimosa');
    expect(identificacao({ brinco: '12', nome: '' })).toBe('12');
  });
});

describe('esquemaAnimal e montarDadosAnimal', () => {
  it('aceita o mínimo: brinco', () => {
    const r = esquemaAnimal.safeParse({ ...FORMULARIO_ANIMAL_VAZIO, brinco: ' 12 ' });
    expect(r.success && r.data.brinco).toBe('12');
  });

  it('exige brinco, data válida e data de saída quando inativo', () => {
    const r = esquemaAnimal.safeParse({
      ...FORMULARIO_ANIMAL_VAZIO,
      dataNascimento: '2026-02-30',
      status: 'vendido',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        'brinco',
        'dataNascimento',
        'dataSaida',
      ]);
    }
  });

  it('não aceita entrada antes do nascimento', () => {
    const r = esquemaAnimal.safeParse({
      ...FORMULARIO_ANIMAL_VAZIO,
      brinco: '1',
      dataNascimento: '2026-01-10',
      dataEntrada: '2026-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('limpa dados de saída de animal ativo e faz ida e volta com o formulário', () => {
    const dados = montarDadosAnimal(
      {
        ...FORMULARIO_ANIMAL_VAZIO,
        brinco: ' 12 ',
        nome: ' Mimosa ',
        dataSaida: '2026-01-01',
        motivoSaida: 'x',
      },
      'mae-1',
    );
    expect(dados).toMatchObject({
      brinco: '12',
      nome: 'Mimosa',
      maeId: 'mae-1',
      dataSaida: null,
      motivoSaida: '',
    });
    expect(formularioDoAnimal(dados)).toEqual({
      ...FORMULARIO_ANIMAL_VAZIO,
      brinco: '12',
      nome: 'Mimosa',
    });
  });
});
