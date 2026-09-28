import { createContext, use, useMemo, type ReactNode } from 'react';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import type { Animal } from '@/domain/animal';
import type { EventoDoAnimal, TratamentoDoAnimal } from '@/firebase/converters';
import {
  animaisLeituraRef,
  eventosDaFazendaQuery,
  tratamentosDaFazendaQuery,
} from '@/firebase/paths';

import { useConsulta } from './leitura';

type DadosFazenda = {
  carregando: boolean;
  animais: Animal[];
  animalPorId: Map<string, Animal>;
  eventosPorAnimal: Map<string, EventoDoAnimal[]>;
  tratamentosPorAnimal: Map<string, TratamentoDoAnimal[]>;
};

const Contexto = createContext<DadosFazenda | null>(null);

/**
 * Mantém escutando os animais e todos os eventos e tratamentos da fazenda enquanto o app está aberto.
 * Assim o cache fica completo (telas abrem offline) e há um só listener por coleção.
 */
export function DadosFazendaProvider({ children }: { children: ReactNode }) {
  const { fazenda } = useSessaoPronta();
  const animais = useConsulta(animaisLeituraRef(fazenda.id), `animais:${fazenda.id}`, 'animais');
  const eventos = useConsulta(
    eventosDaFazendaQuery(fazenda.id),
    `eventos:${fazenda.id}`,
    'eventos',
  );
  const tratamentos = useConsulta(
    tratamentosDaFazendaQuery(fazenda.id),
    `tratamentos:${fazenda.id}`,
    'tratamentos',
  );

  const valor = useMemo<DadosFazenda>(() => {
    return {
      carregando: animais.carregando || eventos.carregando || tratamentos.carregando,
      animais: animais.dados,
      animalPorId: new Map(animais.dados.map((a) => [a.id, a])),
      eventosPorAnimal: agruparPorAnimal(eventos.dados),
      tratamentosPorAnimal: agruparPorAnimal(tratamentos.dados),
    };
  }, [animais, eventos, tratamentos]);

  return <Contexto value={valor}>{children}</Contexto>;
}

function agruparPorAnimal<T extends { animalId: string }>(lista: readonly T[]): Map<string, T[]> {
  const porAnimal = new Map<string, T[]>();
  for (const item of lista) {
    const doAnimal = porAnimal.get(item.animalId);
    if (doAnimal) doAnimal.push(item);
    else porAnimal.set(item.animalId, [item]);
  }
  return porAnimal;
}

export function useDadosFazenda(): DadosFazenda {
  const valor = use(Contexto);
  if (!valor) throw new Error('useDadosFazenda usado fora do DadosFazendaProvider.');
  return valor;
}
