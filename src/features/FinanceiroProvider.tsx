import { createContext, use, useMemo, type ReactNode } from 'react';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import type { Despesa } from '@/domain/despesas';
import type { PrecoLeite } from '@/domain/precoLeite';
import { despesasLeituraRef, precosLeiteLeituraRef } from '@/firebase/paths';

import { useConsulta } from './leitura';

type Financeiro = {
  /** `false` para quem não é dono: o financeiro não é lido nem mostrado. */
  disponivel: boolean;
  carregando: boolean;
  precos: PrecoLeite[];
  despesas: Despesa[];
};

const Contexto = createContext<Financeiro | null>(null);

/**
 * Escuta os dados financeiros enquanto o app está aberto, para ficarem no cache
 * e as telas abrirem offline. Só o dono lê (regras de segurança).
 */
export function FinanceiroProvider({ children }: { children: ReactNode }) {
  const { conta, fazenda } = useSessaoPronta();
  const disponivel = fazenda.membros[conta.uid] === 'dono';
  const precos = useConsulta(
    disponivel ? precosLeiteLeituraRef(fazenda.id) : null,
    disponivel ? `precosLeite:${fazenda.id}` : null,
    'preços do leite',
  );
  const despesas = useConsulta(
    disponivel ? despesasLeituraRef(fazenda.id) : null,
    disponivel ? `despesas:${fazenda.id}` : null,
    'despesas',
  );

  const valor = useMemo<Financeiro>(
    () => ({
      disponivel,
      carregando: disponivel && (precos.carregando || despesas.carregando),
      precos: precos.dados,
      despesas: despesas.dados,
    }),
    [disponivel, precos, despesas],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useFinanceiro(): Financeiro {
  const valor = use(Contexto);
  if (!valor) throw new Error('useFinanceiro usado fora do FinanceiroProvider.');
  return valor;
}
