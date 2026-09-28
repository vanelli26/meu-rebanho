import { diasEntre, isoParaBR, type DataISO } from '@/lib/datas';

import { compararNome, type Animal } from './animal';
import type { ConfiguracoesFazenda } from './fazenda';
import { diasEmLactacao, liberadaParaInseminar } from './lactacao';

export type TipoAlerta =
  'carencia' | 'parto' | 'secagem' | 'diagnostico' | 'retorno_cio' | 'sem_inseminacao';

/** Da mais para a menos urgente. */
export const ORDEM_ALERTAS: readonly TipoAlerta[] = [
  'carencia',
  'parto',
  'secagem',
  'diagnostico',
  'retorno_cio',
  'sem_inseminacao',
];

export const DIAS_AVISO_PARTO = 15;
export const DIAS_AVISO_SECAGEM = 7;
/** Tolerância, em dias, em torno de `diasRetornoCio` para observar o retorno. */
export const JANELA_RETORNO_CIO = 3;
/** Dias além do período voluntário de espera sem inseminação para alertar. */
export const DIAS_SEM_INSEMINACAO = 30;

export type Alerta = {
  tipo: TipoAlerta;
  animalId: string;
  brinco: string;
  nome: string;
  titulo: string;
  detalhe: string;
  /** Data de referência (fim da carência, previsão...). Ordena alertas do mesmo tipo. */
  data: DataISO;
  /** Parto ou secagem com a data prevista já vencida. */
  atrasado: boolean;
};

type AnimalAlerta = Pick<Animal, 'id' | 'brinco' | 'nome' | 'sexo' | 'status' | 'resumo'>;

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function emDias(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias > 0) return `em ${plural(dias, 'dia', 'dias')}`;
  return `há ${plural(-dias, 'dia', 'dias')}`;
}

/**
 * Alertas do painel calculados a partir dos resumos dos animais ativos,
 * do mais urgente para o menos urgente.
 */
export function gerarAlertas(
  animais: readonly AnimalAlerta[],
  config: ConfiguracoesFazenda,
  hoje: DataISO,
): Alerta[] {
  const alertas: Alerta[] = [];

  for (const animal of animais) {
    if (animal.status !== 'ativo' || animal.sexo !== 'F') continue;
    const r = animal.resumo;
    const base = { animalId: animal.id, brinco: animal.brinco, nome: animal.nome };
    const add = (tipo: TipoAlerta, titulo: string, detalhe: string, data: DataISO) =>
      alertas.push({
        ...base,
        tipo,
        titulo,
        detalhe,
        data,
        atrasado: (tipo === 'parto' || tipo === 'secagem') && data < hoje,
      });

    // Carência só importa para quem é ordenhada.
    if (r.carenciaLeiteAte && r.carenciaLeiteAte >= hoje && r.situacao === 'lactacao') {
      add(
        'carencia',
        'Leite fora do tanque',
        `Carência até ${isoParaBR(r.carenciaLeiteAte)}`,
        r.carenciaLeiteAte,
      );
    }

    if (r.prenhe && r.previsaoParto) {
      const dias = diasEntre(hoje, r.previsaoParto);
      if (dias <= DIAS_AVISO_PARTO) {
        add(
          'parto',
          dias < 0 ? 'Parto previsto já passou' : 'Parto próximo',
          `Previsto ${emDias(dias)} (${isoParaBR(r.previsaoParto)})`,
          r.previsaoParto,
        );
      }
    }

    if (r.prenhe && r.situacao === 'lactacao' && r.previsaoSecagem) {
      const dias = diasEntre(hoje, r.previsaoSecagem);
      if (dias <= DIAS_AVISO_SECAGEM) {
        add(
          'secagem',
          dias < 0 ? 'Secagem atrasada' : 'Secar em breve',
          `Prevista ${emDias(dias)} (${isoParaBR(r.previsaoSecagem)})`,
          r.previsaoSecagem,
        );
      }
    }

    if (r.servicoSemDiagnostico) {
      const dias = diasEntre(r.servicoSemDiagnostico, hoje);
      if (dias >= config.diasDiagnosticoGestacao) {
        add(
          'diagnostico',
          'Diagnóstico de gestação pendente',
          `Serviço em ${isoParaBR(r.servicoSemDiagnostico)} (${plural(dias, 'dia', 'dias')})`,
          r.servicoSemDiagnostico,
        );
      } else if (Math.abs(dias - config.diasRetornoCio) <= JANELA_RETORNO_CIO) {
        add(
          'retorno_cio',
          'Observar retorno de cio',
          `${plural(dias, 'dia', 'dias')} após o serviço de ${isoParaBR(r.servicoSemDiagnostico)}`,
          r.servicoSemDiagnostico,
        );
      }
    }

    const semServicoNaLactacao =
      !r.ultimaCobertura || !r.ultimoParto || r.ultimaCobertura < r.ultimoParto;
    if (semServicoNaLactacao && liberadaParaInseminar(r, hoje, config)) {
      const del = diasEmLactacao(r, hoje) ?? 0;
      if (del >= config.periodoVoluntarioEspera + DIAS_SEM_INSEMINACAO) {
        add(
          'sem_inseminacao',
          'Liberada e sem inseminação',
          `${del} dias em lactação, sem serviço desde o parto`,
          r.ultimoParto ?? hoje,
        );
      }
    }
  }

  return alertas.sort(
    (a, b) =>
      ORDEM_ALERTAS.indexOf(a.tipo) - ORDEM_ALERTAS.indexOf(b.tipo) ||
      a.data.localeCompare(b.data) ||
      compararNome(a, b),
  );
}
