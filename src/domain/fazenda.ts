import { z } from 'zod';

export type Papel = 'dono' | 'funcionario';

export type ConfiguracoesFazenda = {
  diasGestacao: number;
  diasSecagemAntesParto: number;
  periodoVoluntarioEspera: number;
  diasDiagnosticoGestacao: number;
  diasRetornoCio: number;
};

export const CONFIGURACOES_PADRAO: ConfiguracoesFazenda = {
  diasGestacao: 283,
  diasSecagemAntesParto: 60,
  periodoVoluntarioEspera: 45,
  diasDiagnosticoGestacao: 35,
  diasRetornoCio: 21,
};

export const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

export type UF = (typeof UFS)[number];

export function ehUF(valor: string): valor is UF {
  return (UFS as readonly string[]).includes(valor);
}

export type DadosNovaFazenda = {
  nome: string;
  municipio: string;
  uf: string;
};

/** Dados cadastrais de uma fazenda nova, sem os carimbos de data. */
export type NovaFazenda = {
  nome: string;
  municipio: string;
  uf: string;
  donoUid: string;
  membros: Record<string, Papel>;
  configuracoes: ConfiguracoesFazenda;
};

/** Monta o documento de uma fazenda recém-criada, com o criador como único dono. */
export function montarNovaFazenda(dados: DadosNovaFazenda, donoUid: string): NovaFazenda {
  return {
    nome: dados.nome.trim(),
    municipio: dados.municipio.trim(),
    uf: dados.uf.trim().toUpperCase(),
    donoUid,
    membros: { [donoUid]: 'dono' },
    configuracoes: { ...CONFIGURACOES_PADRAO },
  };
}

export const esquemaNovaFazenda = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da fazenda.').max(80, 'Nome muito longo.'),
  municipio: z.string().trim().min(1, 'Informe o município.').max(80, 'Nome muito longo.'),
  uf: z.string().trim().toUpperCase().refine(ehUF, 'UF inválida. Use a sigla, ex.: PR.'),
});
