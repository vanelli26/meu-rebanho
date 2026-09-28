import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from '@react-native-firebase/firestore';

import type { ConfiguracoesFazenda, Papel } from '@/domain/fazenda';

/** `usuarios/{uid}` */
export type Usuario = {
  nome: string;
  email: string;
  fotoUrl: string | null;
  fazendaAtualId: string | null;
  createdAt: Timestamp | null;
};

/** `fazendas/{fazendaId}` (o `id` vem do documento, não é gravado). */
export type Fazenda = {
  id: string;
  nome: string;
  municipio: string;
  uf: string;
  donoUid: string;
  membros: Record<string, Papel>;
  configuracoes: ConfiguracoesFazenda;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

/**
 * Conversor só de leitura: tipa o resultado de `onSnapshot`. As gravações usam
 * referências sem conversor, com dados montados pelas funções de `src/domain/`.
 */
function conversorLeitura<T>(
  deSnapshot: (snapshot: QueryDocumentSnapshot) => T,
): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: () => {
      throw new Error('Conversor somente leitura: grave sem withConverter.');
    },
    fromFirestore: (snapshot) => deSnapshot(snapshot),
  };
}

export const usuarioConverter = conversorLeitura<Usuario>((snapshot) => {
  const d = snapshot.data();
  return {
    nome: d.nome ?? '',
    email: d.email ?? '',
    fotoUrl: d.fotoUrl ?? null,
    fazendaAtualId: d.fazendaAtualId ?? null,
    createdAt: d.createdAt ?? null,
  };
});

export const fazendaConverter = conversorLeitura<Fazenda>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    nome: d.nome,
    municipio: d.municipio ?? '',
    uf: d.uf ?? '',
    donoUid: d.donoUid,
    membros: d.membros ?? {},
    configuracoes: d.configuracoes,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
});
