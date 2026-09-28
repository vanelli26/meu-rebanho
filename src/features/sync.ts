import { waitForPendingWrites } from '@react-native-firebase/firestore';
import { useSyncExternalStore } from 'react';

import { db } from '@/firebase/init';
import { criarContadorPendentes } from '@/lib/contadorPendentes';

const contador = criarContadorPendentes((erro, contexto) => {
  console.error(`[gravação] Falha ao sincronizar "${contexto}":`, erro);
});

/**
 * Registra uma gravação sem aguardá-la na UI (regra 1 do Firestore offline).
 * A tela se atualiza pelo `onSnapshot`; o erro vai para o log.
 */
export function acompanharGravacao(promessa: Promise<unknown>, contexto: string): void {
  contador.acompanhar(promessa, contexto);
}

/** Inclui na contagem gravações que ficaram na fila de uma sessão anterior do app. */
export function acompanharFilaAnterior(): void {
  contador.acompanhar(waitForPendingWrites(db), 'fila anterior');
}

export function haGravacoesPendentes(): boolean {
  return contador.quantidade() > 0;
}

/** `true` enquanto houver gravações não confirmadas pelo servidor. */
export function useGravacoesPendentes(): boolean {
  return useSyncExternalStore(contador.assinar, haGravacoesPendentes);
}
