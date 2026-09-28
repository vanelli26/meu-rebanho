import type { Fazenda, Usuario } from '@/firebase/converters';

export type Conta = {
  uid: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
};

export type Sessao =
  | { estado: 'carregando' }
  | { estado: 'deslogado' }
  /** Logado, mas o cache local ainda não tem os dados e não há rede para buscá-los. */
  | { estado: 'aguardando-rede'; conta: Conta }
  | { estado: 'sem-fazenda'; conta: Conta }
  | { estado: 'pronto'; conta: Conta; fazenda: Fazenda };

/** Resultado de um listener de documento: ainda não respondeu, falta no cache, ou dados. */
export type Leitura<T> =
  { tipo: 'esperando' } | { tipo: 'sem-rede' } | { tipo: 'ok'; dados: T | null };

export const ESPERANDO = { tipo: 'esperando' } as const;

/**
 * Decide em que etapa o usuário está (guarda de rotas).
 * `conta` é `undefined` enquanto o Firebase Auth não respondeu.
 */
export function calcularSessao(
  conta: Conta | null | undefined,
  usuario: Leitura<Usuario>,
  fazenda: Leitura<Fazenda>,
): Sessao {
  if (conta === undefined) return { estado: 'carregando' };
  if (conta === null) return { estado: 'deslogado' };

  if (usuario.tipo === 'esperando') return { estado: 'carregando' };
  if (usuario.tipo === 'sem-rede') return { estado: 'aguardando-rede', conta };
  if (!usuario.dados?.fazendaAtualId) return { estado: 'sem-fazenda', conta };

  if (fazenda.tipo === 'esperando') return { estado: 'carregando' };
  if (fazenda.tipo === 'sem-rede') return { estado: 'aguardando-rede', conta };
  if (!fazenda.dados) return { estado: 'sem-fazenda', conta };

  return { estado: 'pronto', conta, fazenda: fazenda.dados };
}
