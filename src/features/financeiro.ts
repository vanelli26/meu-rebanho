import { serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { DadosDespesa } from '@/domain/despesas';
import type { PrecoLeiteValidado } from '@/domain/precoLeite';
import { db } from '@/firebase/init';
import { despesaRef, novoIdDespesa, precoLeiteRef } from '@/firebase/paths';

import { acompanharGravacao } from './sync';

type Contexto = { fazendaId: string; uid: string };

/**
 * Cadastra o preço a partir da data de início. O anterior deixa de valer na
 * véspera (calculado, não gravado). Na mesma data, substitui.
 */
export function salvarPrecoLeite({ fazendaId, uid }: Contexto, preco: PrecoLeiteValidado): void {
  const batch = writeBatch(db);
  batch.set(precoLeiteRef(fazendaId, preco.inicio), {
    inicio: preco.inicio,
    valorLitro: preco.valorLitro,
    observacao: preco.observacao,
    criadoPor: uid,
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'salvar preço do leite');
}

/** Apaga um preço lançado por engano: o anterior volta a valer até o próximo. */
export function excluirPrecoLeite({ fazendaId }: Contexto, inicio: string): void {
  const batch = writeBatch(db);
  batch.delete(precoLeiteRef(fazendaId, inicio));
  acompanharGravacao(batch.commit(), 'excluir preço do leite');
}

/** Cria (sem `id`) ou substitui uma despesa. Não aguarda o servidor. */
export function salvarDespesa(
  { fazendaId, uid }: Contexto,
  id: string | null,
  dados: DadosDespesa,
): void {
  const batch = writeBatch(db);
  batch.set(despesaRef(fazendaId, id ?? novoIdDespesa(fazendaId)), {
    ...dados,
    criadoPor: uid,
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'salvar despesa');
}

export function excluirDespesa({ fazendaId }: Contexto, id: string): void {
  const batch = writeBatch(db);
  batch.delete(despesaRef(fazendaId, id));
  acompanharGravacao(batch.commit(), 'excluir despesa');
}
