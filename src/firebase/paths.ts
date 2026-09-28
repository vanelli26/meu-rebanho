import { collection, doc } from '@react-native-firebase/firestore';

import { fazendaConverter, usuarioConverter } from './converters';
import { db } from './init';

export const usuarioRef = (uid: string) => doc(db, 'usuarios', uid);
export const usuarioLeituraRef = (uid: string) => usuarioRef(uid).withConverter(usuarioConverter);

export const fazendasRef = () => collection(db, 'fazendas');
export const fazendaRef = (fazendaId: string) => doc(db, 'fazendas', fazendaId);
export const fazendaLeituraRef = (fazendaId: string) =>
  fazendaRef(fazendaId).withConverter(fazendaConverter);

/** Gera o ID no cliente, antes de sincronizar. */
export const novoIdFazenda = () => doc(fazendasRef()).id;
