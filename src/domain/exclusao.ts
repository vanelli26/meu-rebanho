import type { Animal } from './animal';
import type { ProducaoOrdenha } from './producao';
import type { EventoReprodutivo } from './reproducao';

/**
 * Tudo o que depende de um animal, para excluí-lo sem deixar sobras: os
 * eventos e tratamentos dele (subcoleções não somem sozinhas), as crias que
 * apontam para ele como mãe e o parto da mãe que aponta para ele como cria.
 */
export type PlanoExclusao = {
  eventoIds: string[];
  tratamentoIds: string[];
  /** Crias cujo `maeId` será limpo. */
  filhoIds: string[];
  /** Parto da mãe que registrou este animal como cria (o `criaId` será limpo). */
  partoDaMae: { animalId: string; eventoId: string } | null;
  /** Ordenhas com registro dele: continuam como estão (os totais já foram entregues). */
  ordenhas: number;
};

export function planoExclusao(
  animal: Pick<Animal, 'id' | 'maeId'>,
  animais: readonly Pick<Animal, 'id' | 'maeId'>[],
  eventosPorAnimal: ReadonlyMap<string, readonly Pick<EventoReprodutivo, 'id' | 'criaId'>[]>,
  tratamentosPorAnimal: ReadonlyMap<string, readonly { id: string }[]>,
  producoes: readonly Pick<ProducaoOrdenha, 'registros'>[],
): PlanoExclusao {
  const parto = animal.maeId
    ? (eventosPorAnimal.get(animal.maeId) ?? []).find((e) => e.criaId === animal.id)
    : undefined;
  return {
    eventoIds: (eventosPorAnimal.get(animal.id) ?? []).map((e) => e.id),
    tratamentoIds: (tratamentosPorAnimal.get(animal.id) ?? []).map((t) => t.id),
    filhoIds: animais.filter((a) => a.maeId === animal.id).map((a) => a.id),
    partoDaMae: parto && animal.maeId ? { animalId: animal.maeId, eventoId: parto.id } : null,
    ordenhas: producoes.filter((p) => p.registros[animal.id]).length,
  };
}

/** Frase do que será apagado junto, para a confirmação. Vazia se não houver nada. */
export function resumoExclusao(plano: PlanoExclusao): string {
  const partes = [
    plano.eventoIds.length &&
      `${plano.eventoIds.length} ${plano.eventoIds.length === 1 ? 'evento' : 'eventos'}`,
    plano.tratamentoIds.length &&
      `${plano.tratamentoIds.length} ${plano.tratamentoIds.length === 1 ? 'tratamento' : 'tratamentos'}`,
  ].filter(Boolean);
  return partes.length ? `Também serão apagados ${partes.join(' e ')}.` : '';
}
