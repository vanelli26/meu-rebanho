import {
  collection,
  collectionGroup,
  doc,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

import type { DataISO } from '@/lib/datas';

import {
  animalConverter,
  eventoConverter,
  fazendaConverter,
  precoLeiteConverter,
  producaoConverter,
  tratamentoConverter,
  usuarioConverter,
} from './converters';
import { db } from './init';

export const usuarioRef = (uid: string) => doc(db, 'usuarios', uid);
export const usuarioLeituraRef = (uid: string) => usuarioRef(uid).withConverter(usuarioConverter);

export const fazendasRef = () => collection(db, 'fazendas');
export const fazendaRef = (fazendaId: string) => doc(db, 'fazendas', fazendaId);
export const fazendaLeituraRef = (fazendaId: string) =>
  fazendaRef(fazendaId).withConverter(fazendaConverter);

/** Gera o ID no cliente, antes de sincronizar. */
export const novoIdFazenda = () => doc(fazendasRef()).id;

export const animaisRef = (fazendaId: string) => collection(db, 'fazendas', fazendaId, 'animais');
export const animalRef = (fazendaId: string, animalId: string) =>
  doc(animaisRef(fazendaId), animalId);
export const animaisLeituraRef = (fazendaId: string) =>
  animaisRef(fazendaId).withConverter(animalConverter);
export const novoIdAnimal = (fazendaId: string) => doc(animaisRef(fazendaId)).id;

export const eventosRef = (fazendaId: string, animalId: string) =>
  collection(animalRef(fazendaId, animalId), 'eventos');
export const novoEventoRef = (fazendaId: string, animalId: string) =>
  doc(eventosRef(fazendaId, animalId));

/**
 * Todos os eventos da fazenda, por grupo de coleção. Mantém o histórico de
 * todas as vacas no cache, para recalcular o resumo mesmo offline.
 */
export const eventosDaFazendaQuery = (fazendaId: string) =>
  query(collectionGroup(db, 'eventos'), where('fazendaId', '==', fazendaId)).withConverter(
    eventoConverter,
  );

export const tratamentosRef = (fazendaId: string, animalId: string) =>
  collection(animalRef(fazendaId, animalId), 'tratamentos');
export const novoTratamentoRef = (fazendaId: string, animalId: string) =>
  doc(tratamentosRef(fazendaId, animalId));

/** Todos os tratamentos da fazenda, por grupo de coleção (carências calculadas offline). */
export const tratamentosDaFazendaQuery = (fazendaId: string) =>
  query(collectionGroup(db, 'tratamentos'), where('fazendaId', '==', fazendaId)).withConverter(
    tratamentoConverter,
  );

export const producaoRef = (fazendaId: string) => collection(db, 'fazendas', fazendaId, 'producao');
export const ordenhaRef = (fazendaId: string, idOrdenha: string) =>
  doc(producaoRef(fazendaId), idOrdenha);
export const ordenhaLeituraRef = (fazendaId: string, idOrdenha: string) =>
  ordenhaRef(fazendaId, idOrdenha).withConverter(producaoConverter);

/** Ordenhas a partir de uma data, mais recentes primeiro. */
export const producaoDesdeQuery = (fazendaId: string, desde: DataISO) =>
  query(producaoRef(fazendaId), where('data', '>=', desde), orderBy('data', 'desc')).withConverter(
    producaoConverter,
  );

export const precosLeiteRef = (fazendaId: string) =>
  collection(db, 'fazendas', fazendaId, 'precosLeite');
/** O id é a data de início: cadastrar de novo na mesma data substitui. */
export const precoLeiteRef = (fazendaId: string, inicio: DataISO) =>
  doc(precosLeiteRef(fazendaId), inicio);
export const precosLeiteLeituraRef = (fazendaId: string) =>
  precosLeiteRef(fazendaId).withConverter(precoLeiteConverter);
