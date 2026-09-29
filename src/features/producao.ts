import { serverTimestamp, writeBatch } from '@react-native-firebase/firestore';
import { useMemo } from 'react';

import { idOrdenha, montarProducao, type Ordenha, type ProducaoOrdenha } from '@/domain/producao';
import { db } from '@/firebase/init';
import { ordenhaLeituraRef, ordenhaRef, producaoDesdeQuery } from '@/firebase/paths';
import { somarDias, type DataISO } from '@/lib/datas';

import { useConsulta, useDocumento, type LeituraDocumento } from './leitura';
import { acompanharGravacao } from './sync';

/** Ordenhas dos últimos `dias` dias (inclui hoje), mais recentes primeiro. */
export function useProducoes(
  fazendaId: string,
  hoje: DataISO,
  dias: number,
): { carregando: boolean; producoes: ProducaoOrdenha[] } {
  return useProducoesDesde(fazendaId, somarDias(hoje, -dias));
}

/** Ordenhas a partir de uma data (inclusive), mais recentes primeiro. */
export function useProducoesDesde(
  fazendaId: string,
  desde: DataISO,
): { carregando: boolean; producoes: ProducaoOrdenha[] } {
  const consulta = useConsulta(
    producaoDesdeQuery(fazendaId, desde),
    `producao:${fazendaId}:${desde}`,
    'produção',
  );
  return useMemo(
    () => ({ carregando: consulta.carregando, producoes: consulta.dados }),
    [consulta],
  );
}

/** Lançamento de uma ordenha específica, para editar. */
export function useOrdenha(
  fazendaId: string,
  data: DataISO | null,
  ordenha: Ordenha,
): LeituraDocumento<ProducaoOrdenha> {
  return useDocumento(
    data ? ordenhaLeituraRef(fazendaId, idOrdenha(data, ordenha)) : null,
    'ordenha',
  );
}

/**
 * Grava a ordenha inteira em um documento (`producao/{data_ordenha}`),
 * substituindo o lançamento anterior da mesma ordenha. Não aguarda o servidor.
 */
export function salvarProducao(
  { fazendaId, uid }: { fazendaId: string; uid: string },
  data: DataISO,
  ordenha: Ordenha,
  lancamentos: Record<string, { litros: number | null; descartado: boolean }>,
): void {
  const batch = writeBatch(db);
  batch.set(ordenhaRef(fazendaId, idOrdenha(data, ordenha)), {
    ...montarProducao(data, ordenha, lancamentos),
    criadoPor: uid,
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'salvar produção');
}
