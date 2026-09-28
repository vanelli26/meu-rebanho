import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';
import type { TipoEvento } from '@/domain/reproducao';
import { calcularResumo } from '@/domain/resumoAnimal';

const hoje = new Date(2026, 8, 28);
const vaca = { sexo: 'F' as const, dataNascimento: '2022-01-01' };
const ev = (data: string, tipo: TipoEvento) => ({ data, tipo });

describe('calcularResumo', () => {
  it('fêmea sem eventos: novilha ou bezerra, conforme a idade', () => {
    expect(calcularResumo(vaca, [], CONFIGURACOES_PADRAO, hoje).situacao).toBe('novilha');
    const bezerra = { sexo: 'F' as const, dataNascimento: '2026-05-01' };
    expect(calcularResumo(bezerra, [], CONFIGURACOES_PADRAO, hoje)).toEqual({
      situacao: 'bezerra',
      prenhe: false,
      ultimoParto: null,
      ultimaCobertura: null,
      ultimaSecagem: null,
      previsaoParto: null,
      previsaoSecagem: null,
      servicoSemDiagnostico: null,
      carenciaLeiteAte: null,
      numeroPartos: 0,
    });
  });

  it('macho ignora eventos', () => {
    const r = calcularResumo(
      { sexo: 'M', dataNascimento: null },
      [ev('2026-01-01', 'parto')],
      CONFIGURACOES_PADRAO,
      hoje,
    );
    expect(r.situacao).toBe('macho');
    expect(r.numeroPartos).toBe(0);
  });

  it('em lactação: parto depois da última secagem', () => {
    const r = calcularResumo(
      vaca,
      [ev('2025-06-01', 'secagem'), ev('2025-08-01', 'parto')],
      CONFIGURACOES_PADRAO,
      hoje,
    );
    expect(r.situacao).toBe('lactacao');
    expect(r.ultimoParto).toBe('2025-08-01');
    expect(r.numeroPartos).toBe(1);
  });

  it('seca: secagem depois do último parto, prenhe com previsões', () => {
    const r = calcularResumo(
      vaca,
      [
        ev('2025-08-01', 'parto'),
        ev('2025-11-10', 'inseminacao'),
        ev('2025-12-20', 'diagnostico_positivo'),
        ev('2026-06-20', 'secagem'),
      ],
      CONFIGURACOES_PADRAO,
      hoje,
    );
    expect(r).toMatchObject({
      situacao: 'seca',
      prenhe: true,
      ultimaCobertura: '2025-11-10',
      ultimaSecagem: '2026-06-20',
      previsaoParto: '2026-08-20',
      previsaoSecagem: '2026-06-21',
    });
  });

  it('ignora eventos com data futura', () => {
    const r = calcularResumo(vaca, [ev('2026-10-01', 'parto')], CONFIGURACOES_PADRAO, hoje);
    expect(r.situacao).toBe('novilha');
  });

  it('mantém a carência informada', () => {
    const r = calcularResumo(vaca, [], CONFIGURACOES_PADRAO, hoje, '2026-10-02');
    expect(r.carenciaLeiteAte).toBe('2026-10-02');
  });
});
