import { calcularSessao, ESPERANDO, type Conta } from '@/auth/sessao';
import type { Fazenda, Usuario } from '@/firebase/converters';
import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';

const conta: Conta = { uid: 'u1', nome: 'Ana', email: 'ana@x.com', fotoUrl: null };

const usuario = (fazendaAtualId: string | null): Usuario => ({
  nome: 'Ana',
  email: 'ana@x.com',
  fotoUrl: null,
  fazendaAtualId,
  createdAt: null,
});

const fazenda: Fazenda = {
  id: 'f1',
  nome: 'Sítio',
  municipio: 'Castro',
  uf: 'PR',
  donoUid: 'u1',
  membros: { u1: 'dono' },
  configuracoes: CONFIGURACOES_PADRAO,
  createdAt: null,
  updatedAt: null,
};

describe('calcularSessao', () => {
  it('carrega enquanto o Auth não respondeu', () => {
    expect(calcularSessao(undefined, ESPERANDO, ESPERANDO).estado).toBe('carregando');
  });

  it('deslogado sem usuário', () => {
    expect(calcularSessao(null, ESPERANDO, ESPERANDO).estado).toBe('deslogado');
  });

  it('carrega enquanto o documento do usuário não respondeu', () => {
    expect(calcularSessao(conta, ESPERANDO, ESPERANDO).estado).toBe('carregando');
  });

  it('aguarda rede quando o usuário não está no cache', () => {
    expect(calcularSessao(conta, { tipo: 'sem-rede' }, ESPERANDO)).toEqual({
      estado: 'aguardando-rede',
      conta,
    });
  });

  it('pede para criar fazenda quando o usuário não existe ou não tem fazenda', () => {
    expect(calcularSessao(conta, { tipo: 'ok', dados: null }, ESPERANDO).estado).toBe(
      'sem-fazenda',
    );
    expect(calcularSessao(conta, { tipo: 'ok', dados: usuario(null) }, ESPERANDO).estado).toBe(
      'sem-fazenda',
    );
  });

  it('carrega e depois aguarda rede para a fazenda', () => {
    const u = { tipo: 'ok', dados: usuario('f1') } as const;
    expect(calcularSessao(conta, u, ESPERANDO).estado).toBe('carregando');
    expect(calcularSessao(conta, u, { tipo: 'sem-rede' }).estado).toBe('aguardando-rede');
  });

  it('volta para criar fazenda se a fazenda não existe ou não é acessível', () => {
    const u = { tipo: 'ok', dados: usuario('f1') } as const;
    expect(calcularSessao(conta, u, { tipo: 'ok', dados: null }).estado).toBe('sem-fazenda');
  });

  it('pronto com usuário e fazenda', () => {
    const u = { tipo: 'ok', dados: usuario('f1') } as const;
    expect(calcularSessao(conta, u, { tipo: 'ok', dados: fazenda })).toEqual({
      estado: 'pronto',
      conta,
      fazenda,
    });
  });
});
