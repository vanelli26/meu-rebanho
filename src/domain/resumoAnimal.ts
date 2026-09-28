import { paraDataISO } from '@/lib/datas';

import { situacaoSemParto, type DadosAnimal, type ResumoAnimal } from './animal';
import type { ConfiguracoesFazenda } from './fazenda';
import { estadoReprodutivo, type EventoReprodutivo } from './reproducao';

/**
 * Recalcula o resumo do animal a partir de todos os seus eventos.
 * Única fonte de `animais/{id}.resumo`: o resumo nunca é editado à mão.
 *
 * `carenciaLeiteAte` vem dos tratamentos e é mantida como está.
 */
export function calcularResumo(
  animal: Pick<DadosAnimal, 'sexo' | 'dataNascimento'>,
  eventos: readonly Pick<EventoReprodutivo, 'data' | 'tipo'>[],
  config: ConfiguracoesFazenda,
  hoje: Date,
  carenciaLeiteAte: ResumoAnimal['carenciaLeiteAte'] = null,
): ResumoAnimal {
  const vazio: ResumoAnimal = {
    situacao: situacaoSemParto(animal.sexo, animal.dataNascimento, hoje),
    prenhe: false,
    ultimoParto: null,
    ultimaCobertura: null,
    ultimaSecagem: null,
    previsaoParto: null,
    previsaoSecagem: null,
    servicoSemDiagnostico: null,
    carenciaLeiteAte,
    numeroPartos: 0,
  };
  if (animal.sexo === 'M') return vazio;

  // Eventos com data futura (digitação errada) não mudam a situação de hoje.
  const ateHoje = eventos.filter((e) => e.data <= paraDataISO(hoje));
  const estado = estadoReprodutivo(ateHoje, config);

  return {
    ...vazio,
    situacao: situacaoDaVaca(estado.ultimoParto, estado.ultimaSecagem) ?? vazio.situacao,
    prenhe: estado.prenhe,
    ultimoParto: estado.ultimoParto,
    ultimaCobertura: estado.ultimaCobertura,
    ultimaSecagem: estado.ultimaSecagem,
    previsaoParto: estado.previsaoParto,
    previsaoSecagem: estado.previsaoSecagem,
    servicoSemDiagnostico: estado.servicoSemDiagnostico,
    numeroPartos: estado.numeroPartos,
  };
}

/** Lactação ou seca, para quem já pariu. `null` se nunca pariu. */
function situacaoDaVaca(
  ultimoParto: string | null,
  ultimaSecagem: string | null,
): 'lactacao' | 'seca' | null {
  if (!ultimoParto) return null;
  return ultimaSecagem && ultimaSecagem >= ultimoParto ? 'seca' : 'lactacao';
}
