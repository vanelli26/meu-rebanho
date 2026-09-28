import type { Alerta } from '@/domain/alertas';
import type { ResumoAnimal } from '@/domain/animal';
import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';
import { montarLembretes, textoLembrete } from '@/domain/lembretes';

const alerta = (tipo: Alerta['tipo'], nome: string): Alerta => ({
  tipo,
  animalId: nome,
  brinco: '1',
  nome,
  titulo: '',
  detalhe: '',
  data: '2026-09-28',
  atrasado: false,
});

describe('textoLembrete', () => {
  it('uma linha por tipo, na ordem de urgência, resumindo nomes demais', () => {
    const texto = textoLembrete([
      alerta('diagnostico', 'Flor'),
      alerta('parto', 'Mimosa'),
      ...['A', 'B', 'C', 'D', 'E'].map((n) => alerta('retorno_cio', n)),
    ]);
    expect(texto.titulo).toBe('7 pendências no rebanho hoje');
    expect(texto.corpo).toBe('Parto: Mimosa\nDiagnóstico: Flor\nObservar cio: A, B, C e mais 2');
  });

  it('singular', () => {
    expect(textoLembrete([alerta('parto', 'Mimosa')]).titulo).toBe('1 pendência no rebanho hoje');
  });
});

describe('montarLembretes', () => {
  const resumo: ResumoAnimal = {
    situacao: 'lactacao',
    prenhe: true,
    ultimoParto: '2025-12-01',
    ultimaCobertura: '2026-01-10',
    ultimaSecagem: null,
    previsaoParto: '2026-10-20',
    previsaoSecagem: '2026-09-30',
    servicoSemDiagnostico: null,
    carenciaLeiteAte: null,
    numeroPartos: 1,
  };
  const mimosa = {
    id: 'a1',
    brinco: '1',
    nome: 'Mimosa',
    sexo: 'F' as const,
    status: 'ativo' as const,
    resumo,
  };

  it('calcula as pendências de cada dia e pula a hora que já passou', () => {
    // 28/09 às 10h, lembrete às 6h: hoje já passou.
    const agora = new Date(2026, 8, 28, 10);
    const lembretes = montarLembretes([mimosa], CONFIGURACOES_PADRAO, agora, '2026-09-28', 6, 7);
    expect(lembretes[0].data).toBe('2026-09-29');
    expect(lembretes[0].quando).toEqual(new Date(2026, 8, 29, 6));
    // Secagem prevista para 30/09: avisa todos os dias (depois, atrasada). O parto em 20/10 fica fora.
    expect(lembretes.map((l) => l.data)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(lembretes.at(-1)?.corpo).toBe('Secar: Mimosa');
    expect(lembretes[0].titulo).toBe('1 pendência no rebanho hoje');
  });

  it('sem pendências, sem lembretes', () => {
    const vazia = { ...mimosa, resumo: { ...resumo, prenhe: false, previsaoParto: null } };
    expect(
      montarLembretes([vazia], CONFIGURACOES_PADRAO, new Date(2026, 8, 28, 5), '2026-09-28', 6),
    ).toEqual([]);
  });
});
