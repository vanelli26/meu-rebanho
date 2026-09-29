import { dataDeISO, somarDias, type DataISO } from '@/lib/datas';

import { situacaoSemParto, type Animal, type Situacao } from './animal';
import type { CategoriaDespesa, Despesa, GrupoDestino } from './despesas';
import { precoNaData, type PrecoLeite } from './precoLeite';
import type { ProducaoOrdenha } from './producao';
import { ordenarEventos, type EventoReprodutivo } from './reproducao';

/**
 * Rateio das despesas entre os animais, por competência (mês da despesa).
 *
 * - Grupo "animais": dividida igualmente entre os escolhidos.
 * - Demais grupos: por **cabeça-dia** — cada animal recebe a parte proporcional
 *   aos dias do mês em que esteve na fazenda e naquele grupo (a vaca que pariu
 *   no dia 10 entra em "lactação" a partir do dia 10).
 * - Lactação com `porLitros`: proporcional aos litros de cada vaca no mês
 *   (quem produz mais come mais concentrado). Sem produção lançada, volta para
 *   cabeça-dia.
 *
 * Valores em centavos, sem arredondar por animal (arredonde na tela).
 */

type AnimalRateio = Pick<
  Animal,
  'id' | 'sexo' | 'dataNascimento' | 'dataEntrada' | 'status' | 'dataSaida'
>;
type EventoRateio = Pick<EventoReprodutivo, 'data' | 'tipo'>;

/** Na fazenda na data: depois da entrada (ou nascimento) e antes da saída. */
export function presenteNaData(animal: AnimalRateio, data: DataISO): boolean {
  const entrada = animal.dataEntrada ?? animal.dataNascimento;
  if (entrada && data < entrada) return false;
  if (animal.status !== 'ativo') return animal.dataSaida !== null && data < animal.dataSaida;
  return true;
}

/** Situação na data, pelos partos e secagens até ela e pela idade. */
export function situacaoNaData(
  animal: Pick<AnimalRateio, 'sexo' | 'dataNascimento'>,
  eventos: readonly EventoRateio[],
  data: DataISO,
): Situacao {
  if (animal.sexo === 'M') return 'macho';
  let parto: DataISO | null = null;
  let secagem: DataISO | null = null;
  for (const e of ordenarEventos(eventos)) {
    if (e.data > data) break;
    if (e.tipo === 'parto') parto = e.data;
    if (e.tipo === 'secagem') secagem = e.data;
  }
  if (parto) return secagem && secagem >= parto ? 'seca' : 'lactacao';
  return situacaoSemParto(animal.sexo, animal.dataNascimento, dataDeISO(data));
}

const NO_GRUPO: Record<Exclude<GrupoDestino, 'animais'>, (s: Situacao) => boolean> = {
  rebanho: () => true,
  lactacao: (s) => s === 'lactacao',
  secas: (s) => s === 'seca',
  recria: (s) => s === 'bezerra' || s === 'novilha',
};

export type CustoAnimal = {
  total: number;
  porCategoria: Partial<Record<CategoriaDespesa, number>>;
};

export type Rateio = {
  porAnimal: Map<string, CustoAnimal>;
  /** Despesas sem ninguém no grupo no período (ex.: "secas" num mês sem vaca seca). */
  naoRateado: number;
};

/** Dias do período (inclusive). */
function diasDoPeriodo(inicio: DataISO, fim: DataISO): DataISO[] {
  const dias: DataISO[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

/**
 * Rateia as despesas de um período (normalmente um mês). `fim` deve ser o último
 * dia já vivido (hoje, no mês corrente), para não contar dias que não passaram.
 */
export function ratearDespesas({
  despesas,
  animais,
  eventosPorAnimal,
  producoes,
  inicio,
  fim,
}: {
  despesas: readonly Pick<
    Despesa,
    'data' | 'categoria' | 'valor' | 'grupo' | 'animalIds' | 'porLitros'
  >[];
  animais: readonly AnimalRateio[];
  eventosPorAnimal: ReadonlyMap<string, readonly EventoRateio[]>;
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'registros'>[];
  inicio: DataISO;
  fim: DataISO;
}): Rateio {
  const porAnimal = new Map<string, CustoAnimal>();
  let naoRateado = 0;

  const somar = (id: string, categoria: CategoriaDespesa, valor: number) => {
    const custo = porAnimal.get(id) ?? { total: 0, porCategoria: {} };
    custo.total += valor;
    custo.porCategoria[categoria] = (custo.porCategoria[categoria] ?? 0) + valor;
    porAnimal.set(id, custo);
  };

  // Cabeças-dia de cada animal em cada grupo, calculadas uma vez para o período.
  const dias = diasDoPeriodo(inicio, fim);
  const cabecasDia = new Map<Exclude<GrupoDestino, 'animais'>, Map<string, number>>(
    (Object.keys(NO_GRUPO) as Exclude<GrupoDestino, 'animais'>[]).map((g) => [g, new Map()]),
  );
  for (const animal of animais) {
    const eventos = eventosPorAnimal.get(animal.id) ?? [];
    for (const dia of dias) {
      if (!presenteNaData(animal, dia)) continue;
      const situacao = situacaoNaData(animal, eventos, dia);
      for (const [grupo, noGrupo] of Object.entries(NO_GRUPO)) {
        if (!noGrupo(situacao)) continue;
        const mapa = cabecasDia.get(grupo as Exclude<GrupoDestino, 'animais'>) as Map<
          string,
          number
        >;
        mapa.set(animal.id, (mapa.get(animal.id) ?? 0) + 1);
      }
    }
  }

  // Litros de cada vaca no período (inclusive descartados: ela comeu igual).
  const litros = new Map<string, number>();
  for (const p of producoes) {
    if (p.data < inicio || p.data > fim) continue;
    for (const [id, r] of Object.entries(p.registros))
      litros.set(id, (litros.get(id) ?? 0) + r.litros);
  }

  const dividir = (
    pesos: ReadonlyMap<string, number>,
    categoria: CategoriaDespesa,
    valor: number,
  ) => {
    const total = [...pesos.values()].reduce((a, b) => a + b, 0);
    if (!total) return false;
    for (const [id, peso] of pesos) somar(id, categoria, (valor * peso) / total);
    return true;
  };

  for (const d of despesas) {
    if (d.data < inicio || d.data > fim) continue;
    let rateou: boolean;
    if (d.grupo === 'animais') {
      rateou = dividir(new Map(d.animalIds.map((id) => [id, 1])), d.categoria, d.valor);
    } else {
      const grupo = cabecasDia.get(d.grupo) as Map<string, number>;
      const pesoLitros =
        d.porLitros && d.grupo === 'lactacao'
          ? new Map(
              [...grupo.keys()].flatMap((id) =>
                litros.get(id) ? [[id, litros.get(id) as number]] : [],
              ),
            )
          : null;
      rateou =
        (pesoLitros !== null && dividir(pesoLitros, d.categoria, d.valor)) ||
        dividir(grupo, d.categoria, d.valor);
    }
    if (!rateou) naoRateado += d.valor;
  }

  return { porAnimal, naoRateado };
}

export type ResultadoAnimal = {
  animalId: string;
  litros: number;
  /** Litros entregues × preço vigente, em centavos. */
  receita: number;
  /** Leite descartado × preço vigente, em centavos (já fora da receita). */
  valorDescartado: number;
  custo: number;
  porCategoria: CustoAnimal['porCategoria'];
  /** Receita − custo, em centavos. */
  margem: number;
};

/** Receita do leite de cada vaca + rateio → margem por animal no período. */
export function resultadoPorAnimal({
  rateio,
  producoes,
  precos,
  inicio,
  fim,
}: {
  rateio: Rateio;
  producoes: readonly Pick<ProducaoOrdenha, 'data' | 'registros'>[];
  precos: readonly PrecoLeite[];
  inicio: DataISO;
  fim: DataISO;
}): ResultadoAnimal[] {
  const resultado = new Map<string, ResultadoAnimal>();
  const obter = (id: string) => {
    let r = resultado.get(id);
    if (!r) {
      const custo = rateio.porAnimal.get(id);
      r = {
        animalId: id,
        litros: 0,
        receita: 0,
        valorDescartado: 0,
        custo: custo?.total ?? 0,
        porCategoria: custo?.porCategoria ?? {},
        margem: 0,
      };
      resultado.set(id, r);
    }
    return r;
  };

  for (const id of rateio.porAnimal.keys()) obter(id);
  for (const p of producoes) {
    if (p.data < inicio || p.data > fim) continue;
    const preco = precoNaData(precos, p.data)?.valorLitro ?? 0;
    for (const [id, reg] of Object.entries(p.registros)) {
      const r = obter(id);
      r.litros += reg.litros;
      if (reg.descartado) r.valorDescartado += reg.litros * preco * 100;
      else r.receita += reg.litros * preco * 100;
    }
  }

  return [...resultado.values()].map((r) => ({
    ...r,
    litros: Math.round(r.litros * 10) / 10,
    margem: r.receita - r.custo,
  }));
}
