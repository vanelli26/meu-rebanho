import {
  brincoDisponivel,
  buscarAnimais,
  chaveBrinco,
  chaveNome,
  compararNome,
  esquemaAnimal,
  FORMULARIO_ANIMAL_VAZIO,
  formularioDoAnimal,
  identificacao,
  montarDadosAnimal,
  nomeDisponivel,
  ordenarPorPrevisaoParto,
  situacaoAtual,
  situacaoSemParto,
  validarDatasAnimal,
  type Animal,
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

describe('chaveNome e nomeDisponivel', () => {
  it('ignora acentos, caixa e espaços extras', () => {
    expect(chaveNome('  Pérola   Negra ')).toBe('perola negra');
  });

  it('detecta nome repetido, exceto no próprio animal', () => {
    const animais = [
      { id: 'a1', nome: 'Mimosa' },
      { id: 'a2', nome: 'Pérola' },
    ];
    expect(nomeDisponivel('mimosa', animais)).toBe(false);
    expect(nomeDisponivel('PEROLA', animais)).toBe(false);
    expect(nomeDisponivel('Mimosa', animais, 'a1')).toBe(true);
    expect(nomeDisponivel('Estrela', animais)).toBe(true);
  });
});

describe('buscarAnimais', () => {
  const animais = [
    { brinco: '10', nome: 'Estrela' },
    { brinco: '2', nome: 'Mimosa' },
    { brinco: '102', nome: 'Pérola' },
    { brinco: '31', nome: 'Malhada' },
  ];

  it('sem termo, ordena pelo nome', () => {
    expect(buscarAnimais(animais, '').map((a) => a.nome)).toEqual([
      'Estrela',
      'Malhada',
      'Mimosa',
      'Pérola',
    ]);
  });

  it('busca por nome sem acento (prefixo primeiro) e também por brinco', () => {
    expect(buscarAnimais(animais, 'perola').map((a) => a.nome)).toEqual(['Pérola']);
    expect(buscarAnimais(animais, ' MA ').map((a) => a.nome)).toEqual(['Malhada']);
    expect(buscarAnimais(animais, 'm').map((a) => a.nome)).toEqual(['Malhada', 'Mimosa']);
    expect(buscarAnimais(animais, '10').map((a) => a.nome)).toEqual(['Estrela', 'Pérola']);
  });
});

describe('identificacao e compararNome', () => {
  it('usa o nome; animal antigo sem nome aparece pelo brinco', () => {
    expect(identificacao({ brinco: '12', nome: 'Mimosa' })).toBe('Mimosa');
    expect(identificacao({ brinco: '12', nome: '' })).toBe('Brinco 12');
  });

  it('ordena alfabeticamente sem diferenciar caixa e com números em ordem natural', () => {
    const a = (nome: string) => ({ brinco: '1', nome });
    expect(compararNome(a('abelha'), a('Bela'))).toBeLessThan(0);
    expect(compararNome(a('Vaca 9'), a('Vaca 10'))).toBeLessThan(0);
  });
});

describe('ordenarPorPrevisaoParto', () => {
  it('ordena pela data prevista e deixa quem não tem previsão no fim, por nome', () => {
    const a = (nome: string, previsaoParto: string | null) => ({
      brinco: '1',
      nome,
      resumo: { previsaoParto } as Animal['resumo'],
    });
    const lista = [
      a('Dália', null),
      a('Bela', '2026-11-20'),
      a('Clara', null),
      a('Ana', '2026-11-03'),
    ];
    expect(ordenarPorPrevisaoParto(lista).map((x) => x.nome)).toEqual([
      'Ana',
      'Bela',
      'Clara',
      'Dália',
    ]);
  });
});

describe('esquemaAnimal e montarDadosAnimal', () => {
  it('aceita o mínimo: nome e brinco', () => {
    const r = esquemaAnimal.safeParse({
      ...FORMULARIO_ANIMAL_VAZIO,
      nome: ' Mimosa ',
      brinco: ' 12 ',
    });
    expect(r.success && [r.data.nome, r.data.brinco]).toEqual(['Mimosa', '12']);
  });

  it('exige nome, brinco, data válida e data de saída quando inativo', () => {
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
        'nome',
      ]);
    }
  });

  it('não aceita entrada antes do nascimento', () => {
    const r = esquemaAnimal.safeParse({
      ...FORMULARIO_ANIMAL_VAZIO,
      brinco: '1',
      nome: 'Mimosa',
      dataNascimento: '2026-01-10',
      dataEntrada: '2026-01-01',
    });
    expect(r.success).toBe(false);
  });

  it('limpa dados de saída de animal ativo e faz ida e volta com o formulário', () => {
    const dados = montarDadosAnimal({
      ...FORMULARIO_ANIMAL_VAZIO,
      brinco: ' 12 ',
      nome: ' Mimosa ',
      dataSaida: '2026-01-01',
      motivoSaida: 'x',
      maeId: 'mae-1',
    });
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
      maeId: 'mae-1',
    });
  });
});

describe('validarDatasAnimal', () => {
  const base = {
    dataNascimento: '2024-01-01',
    dataEntrada: null,
    dataSaida: null,
    status: 'ativo' as const,
    origem: 'nascido' as const,
  };

  it('aceita datas até hoje', () => {
    expect(validarDatasAnimal({ ...base, dataNascimento: '2026-09-29' }, '2026-09-29')).toEqual({});
  });

  it('rejeita datas no futuro', () => {
    expect(
      validarDatasAnimal(
        {
          dataNascimento: '2026-10-01',
          origem: 'comprado',
          dataEntrada: '2026-10-02',
          status: 'vendido',
          dataSaida: '2026-10-03',
        },
        '2026-09-29',
      ),
    ).toEqual({
      dataNascimento: 'A data não pode ser no futuro.',
      dataEntrada: 'A data não pode ser no futuro.',
      dataSaida: 'A data não pode ser no futuro.',
    });
  });

  it('saída antes da entrada ou do nascimento', () => {
    const comprada = { ...base, origem: 'comprado' as const, dataEntrada: '2025-06-01' };
    expect(
      validarDatasAnimal({ ...comprada, status: 'morto', dataSaida: '2025-05-01' }, '2026-09-29')
        .dataSaida,
    ).toMatch(/antes/);
    // Entrada ignorada quando o animal nasceu aqui.
    expect(
      validarDatasAnimal(
        { ...base, dataEntrada: '2025-06-01', status: 'morto', dataSaida: '2025-05-01' },
        '2026-09-29',
      ),
    ).toEqual({});
  });
});
