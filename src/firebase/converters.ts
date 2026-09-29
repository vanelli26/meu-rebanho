import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from '@react-native-firebase/firestore';

import type { Animal, ResumoAnimal } from '@/domain/animal';
import type { Tratamento, TipoTratamento } from '@/domain/carencia';
import type { ConfiguracoesFazenda, Papel } from '@/domain/fazenda';
import type { Ordenha, ProducaoOrdenha, RegistroProducao } from '@/domain/producao';
import type { PrecoLeite } from '@/domain/precoLeite';
import type { EventoReprodutivo, TipoEvento } from '@/domain/reproducao';

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

const RESUMO_VAZIO: ResumoAnimal = {
  situacao: 'novilha',
  prenhe: false,
  ultimoParto: null,
  ultimaCobertura: null,
  ultimaSecagem: null,
  previsaoParto: null,
  previsaoSecagem: null,
  servicoSemDiagnostico: null,
  carenciaLeiteAte: null,
  numeroPartos: 0,
};

/** `fazendas/{fazendaId}/animais/{animalId}` */
export const animalConverter = conversorLeitura<Animal>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    brinco: d.brinco ?? '',
    nome: d.nome ?? '',
    raca: d.raca ?? '',
    sexo: d.sexo === 'M' ? 'M' : 'F',
    dataNascimento: d.dataNascimento ?? null,
    maeId: d.maeId ?? null,
    pai: d.pai ?? '',
    origem: d.origem ?? 'nascido',
    dataEntrada: d.dataEntrada ?? null,
    status: d.status ?? 'ativo',
    dataSaida: d.dataSaida ?? null,
    motivoSaida: d.motivoSaida ?? '',
    observacoes: d.observacoes ?? '',
    resumo: { ...RESUMO_VAZIO, ...(d.resumo ?? {}) },
  };
});

/** Evento com o animal a que pertence (lido por grupo de coleção). */
export type EventoDoAnimal = EventoReprodutivo & { animalId: string };

/** `fazendas/{fazendaId}/animais/{animalId}/eventos/{eventoId}` */
export const eventoConverter = conversorLeitura<EventoDoAnimal>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    animalId: snapshot.ref.parent.parent?.id ?? '',
    data: d.data,
    tipo: d.tipo as TipoEvento,
    touroSemen: d.touroSemen ?? '',
    responsavel: d.responsavel ?? '',
    criaId: d.criaId ?? null,
    observacoes: d.observacoes ?? '',
  };
});

/** Tratamento com o animal a que pertence (lido por grupo de coleção). */
export type TratamentoDoAnimal = Tratamento & { animalId: string };

/** `fazendas/{fazendaId}/animais/{animalId}/tratamentos/{tratamentoId}` */
export const tratamentoConverter = conversorLeitura<TratamentoDoAnimal>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    animalId: snapshot.ref.parent.parent?.id ?? '',
    data: d.data,
    tipo: (d.tipo ?? 'outro') as TipoTratamento,
    produto: d.produto ?? '',
    dose: d.dose ?? '',
    via: d.via ?? '',
    carenciaLeiteDias: d.carenciaLeiteDias ?? 0,
    carenciaCarneDias: d.carenciaCarneDias ?? 0,
    observacoes: d.observacoes ?? '',
  };
});

/** `fazendas/{fazendaId}/producao/{data_ordenha}` */
export const producaoConverter = conversorLeitura<ProducaoOrdenha>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    data: d.data,
    ordenha: d.ordenha as Ordenha,
    registros: (d.registros ?? {}) as Record<string, RegistroProducao>,
    totalLitros: d.totalLitros ?? 0,
    totalDescartado: d.totalDescartado ?? 0,
  };
});

/** `fazendas/{fazendaId}/precosLeite/{inicio}` */
export const precoLeiteConverter = conversorLeitura<PrecoLeite>((snapshot) => {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    inicio: d.inicio ?? snapshot.id,
    valorLitro: d.valorLitro ?? 0,
    observacao: d.observacao ?? '',
  };
});
