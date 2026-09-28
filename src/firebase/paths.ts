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
  producaoConverter,
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

export const producaoRef = (fazendaId: string) => collection(db, 'fazendas', fazendaId, 'producao');
export const ordenhaRef = (fazendaId: string, idOrdenha: string) =>
  doc(producaoRef(fazendaId), idOrdenha);

/** Ordenhas a partir de uma data, mais recentes primeiro. */
export const producaoDesdeQuery = (fazendaId: string, desde: DataISO) =>
  query(producaoRef(fazendaId), where('data', '>=', desde), orderBy('data', 'desc')).withConverter(
    producaoConverter,
  );
