import { analisarMes, type DadosFinanceiros } from '@/domain/analiseMes';
import type { Animal } from '@/domain/animal';
import type { Despesa } from '@/domain/despesas';
import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';
import { montarProducao } from '@/domain/producao';
import type { TipoEvento } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';
import { gerarSugestoes } from '@/domain/sugestoes';

const HOJE = '2026-09-29';
const MESES = ['2026-09', '2026-08', '2026-07', '2026-06'];
const ev = (data: string, tipo: TipoEvento) => ({ data, tipo });

function vaca(id: string, nome: string, eventos: ReturnType<typeof ev>[]): Animal {
  const dados = {
    brinco: id,
    nome,
    raca: '',
    sexo: 'F' as const,
    dataNascimento: '2020-01-01',
    maeId: null,
    pai: '',
    origem: 'nascido' as const,
    dataEntrada: null,
    status: 'ativo' as const,
    dataSaida: null,
    motivoSaida: '',
    observacoes: '',
  };
  return {
    id,
    ...dados,
    resumo: calcularResumo(dados, eventos, CONFIGURACOES_PADRAO, new Date(2026, 8, 29)),
  };
}

const eventosMimosa = [ev('2026-01-01', 'parto')];
const eventosEstrela = [
  ev('2026-01-01', 'parto'),
  ev('2026-03-01', 'inseminacao'),
  ev('2026-04-10', 'diagnostico_positivo'),
];
const animais = [vaca('m', 'Mimosa', eventosMimosa), vaca('e', 'Estrela', eventosEstrela)];

const racao = (data: string, valor: number): Despesa => ({
  id: data,
  data,
  categoria: 'racao',
  descricao: '',
  valor,
  quantidade: null,
  unidade: null,
  grupo: 'lactacao',
  animalIds: [],
  porLitros: false,
  tratamentoId: null,
});

function dados(extra: Partial<DadosFinanceiros> = {}): DadosFinanceiros {
  const producoes = MESES.map((mes) => ({
    id: `${mes}-10_manha`,
    ...montarProducao(`${mes}-10`, 'manha', {
      m: { litros: 5, descartado: false },
      e: { litros: 300, descartado: false },
    }),
  }));
  producoes.push({
    id: '2026-09-20_manha',
    ...montarProducao('2026-09-20', 'manha', { m: { litros: 30, descartado: true } }),
  });
  return {
    hoje: HOJE,
    animais,
    eventosPorAnimal: new Map([
      ['m', eventosMimosa],
      ['e', eventosEstrela],
    ]),
    producoes,
    precos: [{ id: '2026-01-01', inicio: '2026-01-01', valorLitro: 2, observacao: '' }],
    // R$ 400 de ração por mês; em agosto, R$ 600.
    despesas: [racao('2026-06-05', 40000), racao('2026-07-05', 40000), racao('2026-08-05', 60000)],
    ...extra,
  };
}

const sugestoes = (d: DadosFinanceiros) =>
  gerarSugestoes({
    hoje: HOJE,
    meses: MESES.map((m) => analisarMes(m, d)),
    precos: d.precos,
    animais: d.animais,
  });

describe('gerarSugestoes', () => {
  const lista = sugestoes(dados());
  const tipos = lista.map((s) => s.tipo);

  it('encontra as situações do cenário, da mais para a menos urgente', () => {
    expect([...tipos].sort()).toEqual(
      [
        'alimentacao_alta',
        'custo_racao_subindo',
        'leite_descartado',
        'preco_desatualizado',
        'sem_despesas',
        'vaca_prejuizo',
        'vazia_del_alto',
      ].sort(),
    );
    const niveis = lista.map((s) => s.nivel);
    expect(niveis).toEqual(
      [...niveis].sort(
        (a, b) =>
          ['perigo', 'atencao', 'info'].indexOf(a) - ['perigo', 'atencao', 'info'].indexOf(b),
      ),
    );
  });

  it('aponta a vaca no prejuízo, não a que dá lucro', () => {
    const vacas = lista.filter((s) => s.animalId).map((s) => s.animalId);
    expect(vacas).toEqual(['m', 'm']);
    expect(lista.find((s) => s.tipo === 'vaca_prejuizo')?.titulo).toBe(
      'Mimosa deu prejuízo nos últimos 3 meses',
    );
  });

  it('custo da alimentação por litro: +50%', () => {
    expect(lista.find((s) => s.tipo === 'custo_racao_subindo')?.titulo).toBe(
      'Alimentação por litro subiu 50%',
    );
  });

  it('sem preço cadastrado e com produção: pede o preço', () => {
    expect(sugestoes(dados({ precos: [] })).map((s) => s.tipo)).toContain('sem_preco');
  });

  it('mês fechado no prejuízo e custo acima do preço', () => {
    const caro = dados({
      despesas: [racao('2026-08-05', 200000), racao('2026-09-05', 200000)],
    });
    const t = sugestoes(caro).map((s) => s.tipo);
    expect(t).toContain('mes_prejuizo');
    expect(t).toContain('custo_acima_preco');
  });
});

describe('analisarMes', () => {
  it('mês corrente vai até hoje; mês passado está fechado', () => {
    const d = dados();
    const atual = analisarMes('2026-09', d);
    expect([atual.fim, atual.fechado]).toEqual(['2026-09-29', false]);
    const agosto = analisarMes('2026-08', d);
    expect([agosto.fim, agosto.fechado]).toEqual(['2026-08-31', true]);
    expect(agosto.resultado.resultado).toBe(61000 - 60000);
    expect(agosto.animais.find((a) => a.animalId === 'm')?.custo).toBeCloseTo(30000);
  });
});
