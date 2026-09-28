import { createContext, use, useMemo, type ReactNode } from 'react';

import { useSessaoPronta } from '@/auth/SessaoProvider';
import type { Animal } from '@/domain/animal';
import type { EventoDoAnimal } from '@/firebase/converters';
import { animaisLeituraRef, eventosDaFazendaQuery } from '@/firebase/paths';

import { useConsulta } from './leitura';

type DadosFazenda = {
  carregando: boolean;
  animais: Animal[];
  animalPorId: Map<string, Animal>;
  eventosPorAnimal: Map<string, EventoDoAnimal[]>;
};

const Contexto = createContext<DadosFazenda | null>(null);

/**
 * Mantém escutando os animais e todos os eventos da fazenda enquanto o app está aberto.
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

  const valor = useMemo<DadosFazenda>(() => {
    const eventosPorAnimal = new Map<string, EventoDoAnimal[]>();
    for (const evento of eventos.dados) {
      const lista = eventosPorAnimal.get(evento.animalId);
      if (lista) lista.push(evento);
      else eventosPorAnimal.set(evento.animalId, [evento]);
    }
    return {
      carregando: animais.carregando || eventos.carregando,
      animais: animais.dados,
      animalPorId: new Map(animais.dados.map((a) => [a.id, a])),
      eventosPorAnimal,
    };
  }, [animais, eventos]);

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useDadosFazenda(): DadosFazenda {
  const valor = use(Contexto);
  if (!valor) throw new Error('useDadosFazenda usado fora do DadosFazendaProvider.');
  return valor;
}
