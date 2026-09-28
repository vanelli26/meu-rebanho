import { CONFIGURACOES_PADRAO } from '@/domain/fazenda';
import {
  estadoReprodutivo,
  esquemaEvento,
  ordenarEventos,
  validarEventoNaData,
  type TipoEvento,
} from '@/domain/reproducao';

const ev = (data: string, tipo: TipoEvento) => ({ data, tipo });
const config = CONFIGURACOES_PADRAO;

describe('ordenarEventos', () => {
  it('ordena por data e, no mesmo dia, parto antes de cio e serviço antes de diagnóstico', () => {
    const lista = [
      ev('2026-05-01', 'diagnostico_positivo'),
      ev('2026-05-01', 'inseminacao'),
      ev('2026-01-10', 'cio'),
      ev('2026-01-10', 'parto'),
    ];
    expect(ordenarEventos(lista).map((e) => e.tipo)).toEqual([
      'parto',
      'cio',
      'inseminacao',
      'diagnostico_positivo',
    ]);
  });

  it('não altera a lista original', () => {
    const lista = [ev('2026-02-01', 'cio'), ev('2026-01-01', 'cio')];
    ordenarEventos(lista);
    expect(lista[0].data).toBe('2026-02-01');
  });
});

describe('estadoReprodutivo', () => {
  it('sem eventos: vazia e sem previsões', () => {
    expect(estadoReprodutivo([], config)).toEqual({
      ultimoParto: null,
      ultimaSecagem: null,
      ultimaCobertura: null,
      numeroPartos: 0,
      prenhe: false,
      servicoConfirmado: null,
      servicoSemDiagnostico: null,
      previsaoParto: null,
      previsaoSecagem: null,
      intervalosEntrePartos: [],
    });
  });

  it('diagnóstico positivo confirma o último serviço e calcula as previsões', () => {
    const e = estadoReprodutivo(
      [
        ev('2026-01-01', 'inseminacao'),
        ev('2026-01-22', 'inseminacao'),
        ev('2026-02-28', 'diagnostico_positivo'),
      ],
      config,
    );
    expect(e.prenhe).toBe(true);
    expect(e.servicoConfirmado).toBe('2026-01-22');
    // 22/01/2026 + 283 dias = 01/11/2026; − 60 dias = 02/09/2026
    expect(e.previsaoParto).toBe('2026-11-01');
    expect(e.previsaoSecagem).toBe('2026-09-02');
    expect(e.servicoSemDiagnostico).toBeNull();
    expect(e.ultimaCobertura).toBe('2026-01-22');
  });

  it('usa os prazos da fazenda', () => {
    const e = estadoReprodutivo(
      [ev('2026-01-01', 'cobertura'), ev('2026-02-10', 'diagnostico_positivo')],
      { diasGestacao: 280, diasSecagemAntesParto: 45 },
    );
    expect(e.previsaoParto).toBe('2026-10-08');
    expect(e.previsaoSecagem).toBe('2026-08-24');
  });

  it('serviço sem diagnóstico fica pendente', () => {
    const e = estadoReprodutivo([ev('2026-03-01', 'inseminacao')], config);
    expect(e.prenhe).toBe(false);
    expect(e.servicoSemDiagnostico).toBe('2026-03-01');
    expect(e.previsaoParto).toBeNull();
  });

  it('diagnóstico negativo encerra o serviço', () => {
    const e = estadoReprodutivo(
      [ev('2026-03-01', 'inseminacao'), ev('2026-04-05', 'diagnostico_negativo')],
      config,
    );
    expect(e.prenhe).toBe(false);
    expect(e.servicoSemDiagnostico).toBeNull();
  });

  it('parto ou aborto encerram a prenhez', () => {
    const base = [ev('2025-01-01', 'inseminacao'), ev('2025-02-10', 'diagnostico_positivo')];
    const parto = estadoReprodutivo([...base, ev('2025-10-10', 'parto')], config);
    expect(parto.prenhe).toBe(false);
    expect(parto.previsaoParto).toBeNull();
    expect(parto.ultimoParto).toBe('2025-10-10');

    const aborto = estadoReprodutivo([...base, ev('2025-04-01', 'aborto')], config);
    expect(aborto.prenhe).toBe(false);
    expect(aborto.ultimoParto).toBeNull();
    expect(aborto.numeroPartos).toBe(0);
  });

  it('novo serviço depois do diagnóstico positivo exige novo diagnóstico', () => {
    const e = estadoReprodutivo(
      [
        ev('2026-01-01', 'inseminacao'),
        ev('2026-02-10', 'diagnostico_positivo'),
        ev('2026-03-01', 'inseminacao'),
      ],
      config,
    );
    expect(e.prenhe).toBe(false);
    expect(e.servicoSemDiagnostico).toBe('2026-03-01');
  });

  it('diagnóstico positivo sem serviço registrado (vaca comprada prenhe) não prevê parto', () => {
    const e = estadoReprodutivo([ev('2026-02-10', 'diagnostico_positivo')], config);
    expect(e.prenhe).toBe(true);
    expect(e.previsaoParto).toBeNull();
  });

  it('reconfirmação mantém o serviço confirmado', () => {
    const e = estadoReprodutivo(
      [
        ev('2026-01-01', 'inseminacao'),
        ev('2026-02-10', 'diagnostico_positivo'),
        ev('2026-04-10', 'diagnostico_positivo'),
      ],
      config,
    );
    expect(e.servicoConfirmado).toBe('2026-01-01');
  });

  it('conta partos e calcula os intervalos entre partos', () => {
    const e = estadoReprodutivo(
      [ev('2026-02-15', 'parto'), ev('2024-01-01', 'parto'), ev('2025-01-15', 'parto')],
      config,
    );
    expect(e.numeroPartos).toBe(3);
    expect(e.ultimoParto).toBe('2026-02-15');
    expect(e.intervalosEntrePartos).toEqual([380, 396]);
  });

  it('registra a última secagem, mesmo com eventos fora de ordem', () => {
    const e = estadoReprodutivo(
      [ev('2026-06-01', 'secagem'), ev('2025-06-01', 'secagem'), ev('2025-09-01', 'parto')],
      config,
    );
    expect(e.ultimaSecagem).toBe('2026-06-01');
  });
});

describe('validarEventoNaData', () => {
  const vaca = { sexo: 'F' as const, dataNascimento: '2023-01-01' };

  it('aceita data até hoje', () => {
    expect(validarEventoNaData('2026-09-28', '2026-09-28', vaca)).toBeNull();
  });

  it('rejeita futuro, antes do nascimento e macho', () => {
    expect(validarEventoNaData('2026-09-29', '2026-09-28', vaca)).toMatch(/futuro/);
    expect(validarEventoNaData('2022-12-31', '2026-09-28', vaca)).toMatch(/nascimento/);
    expect(validarEventoNaData('2026-01-01', '2026-09-28', { ...vaca, sexo: 'M' })).toMatch(
      /fêmeas/,
    );
  });
});

describe('esquemaEvento', () => {
  const valido = {
    animalId: 'a1',
    tipo: 'parto' as const,
    data: '2026-09-28',
    touroSemen: '',
    responsavel: '',
    observacoes: '',
    cria: { cadastrar: false, brinco: '', nome: '', sexo: 'F' as const },
  };

  it('aceita evento válido', () => {
    expect(esquemaEvento.safeParse(valido).success).toBe(true);
  });

  it('exige data e animal', () => {
    const r = esquemaEvento.safeParse({ ...valido, data: null, animalId: '' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(['animalId', 'data']);
  });

  it('exige brinco quando cadastra a cria', () => {
    const r = esquemaEvento.safeParse({ ...valido, cria: { ...valido.cria, cadastrar: true } });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(['cria', 'brinco']);
  });
});
