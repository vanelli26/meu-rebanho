import { serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import { montarNovaFazenda, type DadosNovaFazenda } from '@/domain/fazenda';
import { db } from '@/firebase/init';
import { fazendaRef, novoIdFazenda, usuarioRef } from '@/firebase/paths';

import { acompanharGravacao } from './sync';

export type DadosConta = {
  uid: string;
  nome: string;
  email: string;
  fotoUrl: string | null;
};

/**
 * Cria a fazenda e aponta o usuário para ela em um único batch.
 * Não aguarda o servidor: o `onSnapshot` da sessão leva o app adiante.
 */
export function criarFazenda(dados: DadosNovaFazenda, conta: DadosConta): string {
  const fazendaId = novoIdFazenda();
  const batch = writeBatch(db);

  batch.set(fazendaRef(fazendaId), {
    ...montarNovaFazenda(dados, conta.uid),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    usuarioRef(conta.uid),
    {
      nome: conta.nome,
      email: conta.email,
      fotoUrl: conta.fotoUrl,
      fazendaAtualId: fazendaId,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  acompanharGravacao(batch.commit(), 'criar fazenda');
  return fazendaId;
}
