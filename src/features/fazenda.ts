import { serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { Animal } from '@/domain/animal';
import {
  montarNovaFazenda,
  type ConfiguracoesFazenda,
  type DadosNovaFazenda,
} from '@/domain/fazenda';
import type { EventoReprodutivo } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { db } from '@/firebase/init';
import { animalRef, fazendaRef, novoIdFazenda, usuarioRef } from '@/firebase/paths';

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

/** Gravações por batch (limite do Firestore: 500). */
const GRAVACOES_POR_BATCH = 400;

/**
 * Salva os prazos e recalcula o resumo de todos os animais, porque as previsões
 * de parto e secagem dependem deles. Fazenda grande vai em mais de um batch.
 */
export function salvarPrazos(
  fazendaId: string,
  configuracoes: ConfiguracoesFazenda,
  animais: readonly Animal[],
  eventosPorAnimal: ReadonlyMap<string, readonly EventoReprodutivo[]>,
): void {
  const hoje = new Date();
  let batch = writeBatch(db);
  batch.update(fazendaRef(fazendaId), { configuracoes, updatedAt: serverTimestamp() });
  let gravacoes = 1;
  for (const animal of animais) {
    if (gravacoes === GRAVACOES_POR_BATCH) {
      acompanharGravacao(batch.commit(), 'recalcular resumos');
      batch = writeBatch(db);
      gravacoes = 0;
    }
    batch.update(animalRef(fazendaId, animal.id), {
      resumo: calcularResumo(
        animal,
        eventosPorAnimal.get(animal.id) ?? [],
        configuracoes,
        hoje,
        animal.resumo.carenciaLeiteAte,
      ),
      updatedAt: serverTimestamp(),
    });
    gravacoes++;
  }
  acompanharGravacao(batch.commit(), 'salvar prazos');
}
