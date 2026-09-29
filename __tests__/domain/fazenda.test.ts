import {
  CONFIGURACOES_PADRAO,
  ehUF,
  esquemaConfiguracoes,
  esquemaNovaFazenda,
  montarNovaFazenda,
  normalizarDadosFazenda,
} from '@/domain/fazenda';

describe('montarNovaFazenda', () => {
  it('normaliza os dados e define o criador como único dono', () => {
    const fazenda = montarNovaFazenda(
      { nome: '  Sítio Boa Vista ', municipio: ' Castro ', uf: 'pr' },
      'uid-1',
    );
    expect(fazenda).toEqual({
      nome: 'Sítio Boa Vista',
      municipio: 'Castro',
      uf: 'PR',
      donoUid: 'uid-1',
      membros: { 'uid-1': 'dono' },
      configuracoes: CONFIGURACOES_PADRAO,
    });
  });

  it('não compartilha o objeto de configurações padrão', () => {
    const fazenda = montarNovaFazenda({ nome: 'A', municipio: 'B', uf: 'SP' }, 'u');
    expect(fazenda.configuracoes).not.toBe(CONFIGURACOES_PADRAO);
  });

  it('usa os prazos padrão do CLAUDE.md', () => {
    expect(CONFIGURACOES_PADRAO).toEqual({
      diasGestacao: 283,
      diasSecagemAntesParto: 60,
      periodoVoluntarioEspera: 45,
      diasDiagnosticoGestacao: 35,
      diasRetornoCio: 21,
    });
  });
});

describe('ehUF', () => {
  it('aceita siglas válidas e rejeita o resto', () => {
    expect(ehUF('PR')).toBe(true);
    expect(ehUF('DF')).toBe(true);
    expect(ehUF('pr')).toBe(false);
    expect(ehUF('XX')).toBe(false);
    expect(ehUF('')).toBe(false);
  });
});

describe('esquemaNovaFazenda', () => {
  it('aceita dados válidos e normaliza a UF', () => {
    const r = esquemaNovaFazenda.safeParse({ nome: ' Sítio ', municipio: 'Castro', uf: ' pr ' });
    expect(r.success && r.data).toEqual({ nome: 'Sítio', municipio: 'Castro', uf: 'PR' });
  });

  it('rejeita campos vazios e UF inexistente', () => {
    const r = esquemaNovaFazenda.safeParse({ nome: ' ', municipio: '', uf: 'XX' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['municipio', 'nome', 'uf']);
    }
  });
});

describe('esquemaConfiguracoes', () => {
  it('aceita os prazos padrão', () => {
    expect(esquemaConfiguracoes.parse(CONFIGURACOES_PADRAO)).toEqual(CONFIGURACOES_PADRAO);
  });

  it('rejeita vazio, fracionado e fora dos limites', () => {
    const r = esquemaConfiguracoes.safeParse({
      ...CONFIGURACOES_PADRAO,
      diasGestacao: null,
      diasRetornoCio: 21.5,
      periodoVoluntarioEspera: 5,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        'diasGestacao',
        'diasRetornoCio',
        'periodoVoluntarioEspera',
      ]);
    }
  });
});

describe('normalizarDadosFazenda', () => {
  it('tira espaços e põe a UF em maiúsculas', () => {
    expect(normalizarDadosFazenda({ nome: ' Sítio ', municipio: ' Castro ', uf: ' pr ' })).toEqual({
      nome: 'Sítio',
      municipio: 'Castro',
      uf: 'PR',
    });
  });
});
