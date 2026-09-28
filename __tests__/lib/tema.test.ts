import { paletas, varsDoTema } from '@/lib/tema';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { theme } = require('../../tailwind.config.js');

describe('tema', () => {
  it('converte a paleta em variáveis CSS RGB', () => {
    const vars = varsDoTema(paletas.claro);
    expect(vars['--fundo']).toBe('247 244 236');
    expect(vars['--primaria-suave']).toBe('227 237 230');
    expect(vars['--superficie-2']).toBe('239 235 224');
  });

  it('claro e escuro têm as mesmas cores', () => {
    expect(Object.keys(paletas.escuro).sort()).toEqual(Object.keys(paletas.claro).sort());
  });

  it('o Tailwind conhece todas as cores da paleta', () => {
    const doTailwind = Object.keys(theme.extend.colors).sort();
    const daPaleta = Object.keys(varsDoTema(paletas.claro))
      .map((v) => v.slice(2))
      .sort();
    expect(doTailwind).toEqual(daPaleta);
  });
});
