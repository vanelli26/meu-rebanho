import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  type Firestore,
} from '@react-native-firebase/firestore';

// As configurações precisam ser aplicadas antes de qualquer leitura ou gravação,
// por isso a instância é criada uma única vez aqui e reutilizada pelo app.
export const db: Firestore = initializeFirestore(getApp(), {
  persistence: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

export const auth = getAuth(getApp());
