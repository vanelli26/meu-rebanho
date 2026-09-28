import { serverTimestamp, writeBatch } from '@react-native-firebase/firestore';

import type { Animal, DadosAnimal } from '@/domain/animal';
import type { Tratamento } from '@/domain/carencia';
import type { ConfiguracoesFazenda } from '@/domain/fazenda';
import type { EventoReprodutivo } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { db } from '@/firebase/init';
import { animalRef, novoIdAnimal } from '@/firebase/paths';

import { useDadosFazenda } from './DadosFazendaProvider';
import { acompanharGravacao } from './sync';

export function useAnimais(): { carregando: boolean; animais: Animal[] } {
  const { carregando, animais } = useDadosFazenda();
  return { carregando, animais };
}

export function useAnimal(animalId: string | undefined): {
  carregando: boolean;
  animal: Animal | null;
  eventos: EventoReprodutivo[];
  tratamentos: Tratamento[];
} {
  const { carregando, animalPorId, eventosPorAnimal, tratamentosPorAnimal } = useDadosFazenda();
  return {
    carregando,
    animal: (animalId && animalPorId.get(animalId)) || null,
    eventos: (animalId && eventosPorAnimal.get(animalId)) || [],
    tratamentos: (animalId && tratamentosPorAnimal.get(animalId)) || [],
  };
}

type Contexto = { fazendaId: string; config: ConfiguracoesFazenda };

/** Cadastra o animal com o resumo inicial. Não aguarda o servidor. */
export function criarAnimal({ fazendaId, config }: Contexto, dados: DadosAnimal): string {
  const id = novoIdAnimal(fazendaId);
  const batch = writeBatch(db);
  batch.set(animalRef(fazendaId, id), {
    ...dados,
    resumo: calcularResumo(dados, [], config, new Date()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'cadastrar animal');
  return id;
}

/**
 * Atualiza os dados cadastrais. Sexo e nascimento mudam a situação, então o
 * resumo é recalculado com os eventos em cache no mesmo batch.
 */
export function editarAnimal(
  { fazendaId, config }: Contexto,
  animal: Animal,
  eventos: readonly EventoReprodutivo[],
  dados: DadosAnimal,
): void {
  const batch = writeBatch(db);
  batch.update(animalRef(fazendaId, animal.id), {
    ...dados,
    resumo: calcularResumo(dados, eventos, config, new Date(), animal.resumo.carenciaLeiteAte),
    updatedAt: serverTimestamp(),
  });
  acompanharGravacao(batch.commit(), 'editar animal');
}
