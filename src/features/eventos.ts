import { doc, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { Animal, DadosAnimal, Sexo } from '@/domain/animal';
import type { ConfiguracoesFazenda } from '@/domain/fazenda';
import { servicoDoParto, type EventoReprodutivo, type TipoEvento } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { db } from '@/firebase/init';
import { animalRef, eventosRef, novoEventoRef, novoIdAnimal } from '@/firebase/paths';
import type { DataISO } from '@/lib/datas';

import { acompanharGravacao } from './sync';

type Contexto = { fazendaId: string; config: ConfiguracoesFazenda; uid: string };

export type NovoEvento = {
  tipo: TipoEvento;
  data: DataISO;
  touroSemen: string;
  responsavel: string;
  observacoes: string;
};

export type NovaCria = { brinco: string; nome: string; sexo: Sexo };

/**
 * Em um único batch: cria o evento, cadastra a cria (no parto, se informada)
 * e grava o resumo da vaca recalculado com os eventos em cache + o novo.
 */
export function registrarEvento(
  { fazendaId, config, uid }: Contexto,
  animal: Animal,
  eventosAtuais: readonly EventoReprodutivo[],
  evento: NovoEvento,
  cria: NovaCria | null,
): void {
  const hoje = new Date();
  const batch = writeBatch(db);
  const ref = novoEventoRef(fazendaId, animal.id);

  let criaId: string | null = null;
  if (evento.tipo === 'parto' && cria) {
    criaId = novoIdAnimal(fazendaId);
    const dadosCria: DadosAnimal = {
      brinco: cria.brinco.trim(),
      nome: cria.nome.trim(),
      raca: animal.raca,
      sexo: cria.sexo,
      dataNascimento: evento.data,
      maeId: animal.id,
      pai: servicoDoParto(eventosAtuais, evento.data)?.touroSemen ?? '',
      origem: 'nascido',
      dataEntrada: evento.data,
      status: 'ativo',
      dataSaida: null,
      motivoSaida: '',
      observacoes: '',
    };
    batch.set(animalRef(fazendaId, criaId), {
      ...dadosCria,
      resumo: calcularResumo(dadosCria, [], config, hoje),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const dadosEvento = {
    data: evento.data,
    tipo: evento.tipo,
    touroSemen: evento.touroSemen.trim(),
    responsavel: evento.responsavel.trim(),
    observacoes: evento.observacoes.trim(),
    criaId,
  };
  batch.set(ref, {
    ...dadosEvento,
    fazendaId,
    criadoPor: uid,
    createdAt: serverTimestamp(),
  });

  const eventos = [...eventosAtuais, { ...dadosEvento, id: ref.id }];
  batch.update(animalRef(fazendaId, animal.id), {
    resumo: calcularResumo(animal, eventos, config, hoje, animal.resumo.carenciaLeiteAte),
    updatedAt: serverTimestamp(),
  });

  acompanharGravacao(batch.commit(), `registrar ${evento.tipo}`);
}

/** Apaga um evento lançado por engano e recalcula o resumo no mesmo batch. */
export function excluirEvento(
  { fazendaId, config }: Omit<Contexto, 'uid'>,
  animal: Animal,
  eventosAtuais: readonly EventoReprodutivo[],
  eventoId: string,
): void {
  const batch = writeBatch(db);
  batch.delete(doc(eventosRef(fazendaId, animal.id), eventoId));
  const restantes = eventosAtuais.filter((e) => e.id !== eventoId);
  batch.update(animalRef(fazendaId, animal.id), {
    resumo: calcularResumo(animal, restantes, config, new Date(), animal.resumo.carenciaLeiteAte),
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'excluir evento');
}
