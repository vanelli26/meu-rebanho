import type { Animal, ResumoAnimal } from '@/domain/animal';
import { gerarAlertas } from '@/domain/alertas';
import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';

const HOJE = '2026-09-28';

const resumoBase: ResumoAnimal = {
  situacao: 'lactacao',
  prenhe: false,
  ultimoParto: '2026-09-01',
  ultimaCobertura: null,
  ultimaSecagem: null,
  previsaoParto: null,
  previsaoSecagem: null,
  servicoSemDiagnostico: null,
  carenciaLeiteAte: null,
  numeroPartos: 1,
};

let seq = 0;
function vaca(resumo: Partial<ResumoAnimal>, extra: Partial<Animal> = {}) {
  seq += 1;
  return {
    id: `a${seq}`,
    brinco: String(seq),
    nome: '',
    sexo: 'F' as const,
    status: 'ativo' as const,
    resumo: { ...resumoBase, ...resumo },
    ...extra,
  };
}

const tipos = (animais: ReturnType<typeof vaca>[]) =>
  gerarAlertas(animais, CONFIGURACOES_PADRAO, HOJE).map((a) => a.tipo);

describe('gerarAlertas', () => {
  it('sem pendências, sem alertas', () => {
    expect(tipos([vaca({})])).toEqual([]);
  });

  it('carência ativa só para vaca em lactação', () => {
    expect(tipos([vaca({ carenciaLeiteAte: HOJE })])).toEqual(['carencia']);
    expect(tipos([vaca({ carenciaLeiteAte: '2026-09-27' })])).toEqual([]);
    expect(tipos([vaca({ carenciaLeiteAte: HOJE, situacao: 'seca' })])).toEqual([]);
  });

  it('parto previsto nos próximos 15 dias ou vencido', () => {
    const prenhe = { prenhe: true, situacao: 'seca' as const };
    expect(tipos([vaca({ ...prenhe, previsaoParto: '2026-10-13' })])).toEqual(['parto']);
    expect(tipos([vaca({ ...prenhe, previsaoParto: '2026-10-14' })])).toEqual([]);
    const [vencido] = gerarAlertas(
      [vaca({ ...prenhe, previsaoParto: '2026-09-20' })],
      CONFIGURACOES_PADRAO,
      HOJE,
    );
    expect(vencido.atrasado).toBe(true);
  });

  it('secagem nos próximos 7 dias ou atrasada, só se ainda em lactação', () => {
    const prenhe = { prenhe: true, previsaoParto: '2027-01-01' };
    expect(tipos([vaca({ ...prenhe, previsaoSecagem: '2026-10-05' })])).toEqual(['secagem']);
    expect(tipos([vaca({ ...prenhe, previsaoSecagem: '2026-10-06' })])).toEqual([]);
    expect(tipos([vaca({ ...prenhe, previsaoSecagem: '2026-09-01' })])).toEqual(['secagem']);
    expect(tipos([vaca({ ...prenhe, previsaoSecagem: '2026-09-01', situacao: 'seca' })])).toEqual(
      [],
    );
  });

  it('retorno de cio entre 18 e 24 dias e diagnóstico a partir de 35 dias', () => {
    const servico = (data: string) => ({ ultimaCobertura: data, servicoSemDiagnostico: data });
    expect(tipos([vaca(servico('2026-09-11'))])).toEqual([]); // 17 dias
    expect(tipos([vaca(servico('2026-09-10'))])).toEqual(['retorno_cio']); // 18 dias
    expect(tipos([vaca(servico('2026-09-04'))])).toEqual(['retorno_cio']); // 24 dias
    expect(tipos([vaca(servico('2026-09-03'))])).toEqual([]); // 25 dias
    expect(tipos([vaca(servico('2026-08-24'))])).toEqual(['diagnostico']); // 35 dias
  });

  it('liberada há mais de 30 dias sem inseminação', () => {
    // PVE 45 + 30 = 75 dias em lactação
    expect(tipos([vaca({ ultimoParto: '2026-07-15' })])).toEqual(['sem_inseminacao']); // 75
    expect(tipos([vaca({ ultimoParto: '2026-07-16' })])).toEqual([]); // 74
    expect(tipos([vaca({ ultimoParto: '2026-07-01', ultimaCobertura: '2026-08-20' })])).toEqual([]);
    expect(tipos([vaca({ ultimoParto: '2026-07-01', ultimaCobertura: '2025-10-01' })])).toEqual([
      'sem_inseminacao',
    ]);
  });

  it('ignora machos e animais inativos', () => {
    const r = { carenciaLeiteAte: HOJE };
    expect(tipos([vaca(r, { sexo: 'M' }), vaca(r, { status: 'vendido' })])).toEqual([]);
  });

  it('ordena por urgência e depois por data', () => {
    const alertas = gerarAlertas(
      [
        vaca({ ultimoParto: '2026-06-01' }),
        vaca({ prenhe: true, situacao: 'seca', previsaoParto: '2026-10-10' }),
        vaca({ prenhe: true, situacao: 'seca', previsaoParto: '2026-10-01' }),
        vaca({ carenciaLeiteAte: '2026-10-01' }),
      ],
      CONFIGURACOES_PADRAO,
      HOJE,
    );
    expect(alertas.map((a) => [a.tipo, a.data])).toEqual([
      ['carencia', '2026-10-01'],
      ['parto', '2026-10-01'],
      ['parto', '2026-10-10'],
      ['sem_inseminacao', '2026-06-01'],
    ]);
  });
});
