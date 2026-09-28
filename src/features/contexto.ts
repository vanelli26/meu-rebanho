import { useSessaoPronta } from '@/auth/SessaoProvider';
import type { ConfiguracoesFazenda } from '@/domain/fazenda';

export type ContextoGravacao = {
  fazendaId: string;
  uid: string;
  config: ConfiguracoesFazenda;
};

/** Fazenda, usuário e prazos, usados pelas ações de gravação. */
export function useContextoGravacao(): ContextoGravacao {
  const { conta, fazenda } = useSessaoPronta();
  return { fazendaId: fazenda.id, uid: conta.uid, config: fazenda.configuracoes };
}
