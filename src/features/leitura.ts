import { onSnapshot, type DocumentReference, type Query } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';

export type Consulta<T> = {
  /** `true` até o primeiro resultado (do cache ou do servidor). */
  carregando: boolean;
  dados: T[];
};

const VAZIA = { carregando: true, dados: [] };

/**
 * Escuta uma consulta com `onSnapshot` (regra 5 do Firestore offline).
 * `chave` identifica a consulta: a referência muda a cada render, a chave não.
 * Após um erro o listener morre; tenta de novo em alguns segundos.
 */
export function useConsulta<T>(
  consulta: Query<T> | null,
  chave: string | null,
  rotulo: string,
): Consulta<T> {
  const [estado, setEstado] = useState<{ chave: string; consulta: Consulta<T> } | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!consulta || !chave) return;
    let retentativa: ReturnType<typeof setTimeout> | undefined;
    const parar = onSnapshot(
      consulta,
      (snap) => {
        setEstado({
          chave,
          consulta: { carregando: false, dados: snap.docs.map((d) => d.data()) },
        });
      },
      (erro) => {
        console.error(`[leitura] Falha ao ler ${rotulo}:`, erro);
        retentativa = setTimeout(() => setTentativa((t) => t + 1), 5000);
      },
    );
    return () => {
      parar();
      clearTimeout(retentativa);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, rotulo, tentativa]);

  return estado && estado.chave === chave ? estado.consulta : (VAZIA as Consulta<T>);
}

export type LeituraDocumento<T> = { carregando: boolean; dados: T | null };

/**
 * Escuta um documento. Ausente no cache e sem resposta do servidor ainda conta
 * como "carregando" para não confundir "não baixado" com "não existe".
 */
export function useDocumento<T>(
  ref: DocumentReference<T> | null,
  rotulo: string,
): LeituraDocumento<T> {
  const caminho = ref?.path ?? null;
  const [estado, setEstado] = useState<{ caminho: string; leitura: LeituraDocumento<T> } | null>(
    null,
  );

  useEffect(() => {
    if (!ref || !caminho) return;
    let ultimo: LeituraDocumento<T> | null = null;
    const salvar = (leitura: LeituraDocumento<T>) => {
      ultimo = leitura;
      setEstado({ caminho, leitura });
    };
    // Offline, o servidor nunca responde: após um tempo, assume que não existe.
    const limite = setTimeout(() => {
      if (!ultimo) salvar({ carregando: false, dados: null });
    }, 1500);
    const parar = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) salvar({ carregando: false, dados: snap.data() ?? null });
        else if (!snap.metadata.fromCache) salvar({ carregando: false, dados: null });
      },
      (erro) => {
        console.error(`[leitura] Falha ao ler ${rotulo}:`, erro);
        salvar({ carregando: false, dados: null });
      },
    );
    return () => {
      parar();
      clearTimeout(limite);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminho, rotulo]);

  return estado && estado.caminho === caminho ? estado.leitura : { carregando: true, dados: null };
}
