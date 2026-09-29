import { doc, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { Animal } from '@/domain/animal';
import { carenciaLeiteAte, type NovoTratamento, type Tratamento } from '@/domain/carencia';
import { despesaDoTratamento, despesaSemAnimal, type Despesa } from '@/domain/despesas';
import type { EventoReprodutivo } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { db } from '@/firebase/init';
import {
  animalRef,
  despesaRef,
  novoIdDespesa,
  novoTratamentoRef,
  tratamentosRef,
} from '@/firebase/paths';

import type { ContextoGravacao } from './contexto';
import { acompanharGravacao } from './sync';

/** Animais por batch: cada um gera 2 gravações e o limite do Firestore é 500. */
const ANIMAIS_POR_BATCH = 200;

type Historico = {
  eventosPorAnimal: ReadonlyMap<string, readonly EventoReprodutivo[]>;
  tratamentosPorAnimal: ReadonlyMap<string, readonly Tratamento[]>;
};

/**
 * Registra o mesmo tratamento em um ou vários animais. Para cada um, no mesmo
 * batch: cria o tratamento e grava o resumo com a carência de leite recalculada.
 */
export function registrarTratamento(
  { fazendaId, config, uid }: ContextoGravacao,
  animais: readonly Animal[],
  { eventosPorAnimal, tratamentosPorAnimal }: Historico,
  tratamentoSemCusto: NovoTratamento,
  /** Custo total em reais (só o dono informa: o financeiro é restrito). */
  custoReais: number | null = null,
): void {
  const hoje = new Date();
  const despesaId = custoReais ? novoIdDespesa(fazendaId) : null;
  const tratamento = { ...tratamentoSemCusto, despesaId };
  for (let i = 0; i < animais.length; i += ANIMAIS_POR_BATCH) {
    const batch = writeBatch(db);
    for (const animal of animais.slice(i, i + ANIMAIS_POR_BATCH)) {
      const ref = novoTratamentoRef(fazendaId, animal.id);
      batch.set(ref, { ...tratamento, fazendaId, criadoPor: uid, createdAt: serverTimestamp() });
      // O custo vira uma despesa do lote, gravada junto com o primeiro tratamento.
      if (despesaId && custoReais && animal === animais[0]) {
        batch.set(despesaRef(fazendaId, despesaId), {
          ...despesaDoTratamento(
            tratamento,
            animais.map((a) => a.id),
            custoReais,
            ref.id,
          ),
          criadoPor: uid,
          updatedAt: serverTimestamp(),
        });
      }
      const tratamentos = [...(tratamentosPorAnimal.get(animal.id) ?? []), tratamento];
      batch.update(animalRef(fazendaId, animal.id), {
        resumo: calcularResumo(
          animal,
          eventosPorAnimal.get(animal.id) ?? [],
          config,
          hoje,
          carenciaLeiteAte(tratamentos),
        ),
        updatedAt: serverTimestamp(),
      });
    }
    acompanharGravacao(batch.commit(), `registrar tratamento (${animais.length} animais)`);
  }
}

/** Apaga um tratamento lançado por engano e recalcula a carência no mesmo batch. */
export function excluirTratamento(
  { fazendaId, config }: ContextoGravacao,
  animal: Animal,
  eventos: readonly EventoReprodutivo[],
  tratamentosAtuais: readonly Tratamento[],
  tratamentoId: string,
  /** Despesa do custo do tratamento: perde a parte deste animal. */
  despesa: Despesa | null = null,
): void {
  const batch = writeBatch(db);
  batch.delete(doc(tratamentosRef(fazendaId, animal.id), tratamentoId));
  if (despesa) {
    const restante = despesaSemAnimal(despesa, animal.id);
    if (restante) batch.set(despesaRef(fazendaId, despesa.id), restante, { merge: true });
    else if (despesa.animalIds.includes(animal.id)) batch.delete(despesaRef(fazendaId, despesa.id));
  }
  const restantes = tratamentosAtuais.filter((t) => t.id !== tratamentoId);
  batch.update(animalRef(fazendaId, animal.id), {
    resumo: calcularResumo(animal, eventos, config, new Date(), carenciaLeiteAte(restantes)),
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'excluir tratamento');
}
