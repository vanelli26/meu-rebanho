import { onAuthStateChanged, type User } from '@react-native-firebase/auth';
import { onSnapshot, type DocumentReference } from '@react-native-firebase/firestore';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { auth } from '@/firebase/init';
import { fazendaLeituraRef, usuarioLeituraRef } from '@/firebase/paths';
import { acompanharFilaAnterior } from '@/features/sync';

import { calcularSessao, ESPERANDO, type Conta, type Leitura, type Sessao } from './sessao';

export type { Conta, Sessao };

const SessaoContext = createContext<Sessao>({ estado: 'carregando' });

function paraConta(user: User): Conta {
  return {
    uid: user.uid,
    nome: user.displayName ?? '',
    email: user.email ?? '',
    fotoUrl: user.photoURL ?? null,
  };
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, (novo) => setUser(novo)), []);

  const uid = user?.uid;
  useEffect(() => {
    if (uid) acompanharFilaAnterior();
  }, [uid]);

  const usuario = useLeitura(uid ? usuarioLeituraRef(uid) : null, 'usuário');
  const fazendaId = usuario.tipo === 'ok' ? usuario.dados?.fazendaAtualId : undefined;
  const fazenda = useLeitura(fazendaId ? fazendaLeituraRef(fazendaId) : null, 'fazenda');

  return (
    <SessaoContext value={calcularSessao(user ? paraConta(user) : user, usuario, fazenda)}>
      {children}
    </SessaoContext>
  );
}

/**
 * Escuta um documento e informa se ele existe. A leitura é guardada junto do
 * caminho, para que ao trocar de documento o valor antigo não seja usado.
 */
function useLeitura<T>(ref: DocumentReference<T> | null, rotulo: string): Leitura<T> {
  const caminho = ref?.path ?? null;
  const [estado, setEstado] = useState<{ caminho: string; leitura: Leitura<T> } | null>(null);

  useEffect(() => {
    if (!ref) return;
    const salvar = (leitura: Leitura<T>) => setEstado({ caminho: ref.path, leitura });
    return onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        // Documento ausente só no cache pode existir no servidor: espera a rede.
        // Não chamar data() em documento inexistente: o RNFB roda o conversor com dados vazios.
        if (snap.exists()) salvar({ tipo: 'ok', dados: snap.data() ?? null });
        else if (snap.metadata.fromCache) salvar({ tipo: 'sem-rede' });
        else salvar({ tipo: 'ok', dados: null });
      },
      (erro) => {
        console.error(`[sessão] Falha ao ler ${rotulo}:`, erro);
        salvar({ tipo: 'ok', dados: null });
      },
    );
    // O caminho identifica o documento; a referência muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminho, rotulo]);

  return estado && estado.caminho === caminho ? estado.leitura : ESPERANDO;
}

export function useSessao(): Sessao {
  return use(SessaoContext);
}

/** Para telas dentro da área logada: garante conta e fazenda. */
export function useSessaoPronta(): Extract<Sessao, { estado: 'pronto' }> {
  const sessao = useSessao();
  if (sessao.estado !== 'pronto') throw new Error('useSessaoPronta usado fora da área logada.');
  return sessao;
}
