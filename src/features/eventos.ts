import { doc, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { Animal, DadosAnimal, Sexo } from '@/domain/animal';
import type { ConfiguracoesFazenda } from '@/domain/fazenda';
import {
  servicoDoParto,
  vinculoDaCria,
  type EventoReprodutivo,
  type TipoEvento,
} from '@/domain/reproducao';
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

/** Cria do parto: cadastrada agora ou um animal já cadastrado antes do parto. */
export type CriaDoParto =
  | { tipo: 'nova'; dados: NovaCria }
  | { tipo: 'existente'; animal: Animal; eventos: readonly EventoReprodutivo[] };

/**
 * Em um único batch: cria o evento, cadastra a cria nova ou liga a já cadastrada
 * (no parto) e grava o resumo da vaca recalculado com os eventos em cache + o novo.
 */
export function registrarEvento(
  { fazendaId, config, uid }: Contexto,
  animal: Animal,
  eventosAtuais: readonly EventoReprodutivo[],
  evento: NovoEvento,
  cria: CriaDoParto | null,
): void {
  const hoje = new Date();
  const batch = writeBatch(db);
  const ref = novoEventoRef(fazendaId, animal.id);

  let criaId: string | null = null;
  const pai = servicoDoParto(eventosAtuais, evento.data)?.touroSemen ?? '';
  if (evento.tipo === 'parto' && cria?.tipo === 'existente') {
    // Cria cadastrada antes do parto: liga à mãe e completa o que estiver em branco.
    criaId = cria.animal.id;
    const vinculo = vinculoDaCria(cria.animal, animal.id, evento.data, pai);
    batch.update(animalRef(fazendaId, criaId), {
      ...vinculo,
      resumo: calcularResumo(
        { ...cria.animal, ...vinculo },
        cria.eventos,
        config,
        hoje,
        cria.animal.resumo.carenciaLeiteAte,
      ),
      updatedAt: serverTimestamp(),
    });
  } else if (evento.tipo === 'parto' && cria?.tipo === 'nova') {
    criaId = novoIdAnimal(fazendaId);
    const dadosCria: DadosAnimal = {
      brinco: cria.dados.brinco.trim(),
      nome: cria.dados.nome.trim(),
      raca: animal.raca,
      sexo: cria.dados.sexo,
      dataNascimento: evento.data,
      maeId: animal.id,
      pai,
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
