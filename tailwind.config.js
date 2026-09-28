// Mesmos nomes de `paletas` em src/lib/tema.ts (os valores ficam lá).
const NOMES = [
  'fundo', 'superficie', 'superficie2', 'borda', 'texto', 'textoSuave',
  'primaria', 'primariaForte', 'primariaSuave', 'sobrePrimaria',
  'destaque', 'destaqueSuave', 'perigo', 'perigoSuave', 'atencao', 'atencaoSuave',
  'sucesso', 'sucessoSuave', 'info', 'infoSuave',
];

/** Cada cor lê a variável CSS aplicada em app/_layout.tsx (tema claro/escuro). */
const cores = Object.fromEntries(
  NOMES.map((nome) => {
    const kebab = nome.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);
    return [kebab, `rgb(var(--${kebab}) / <alpha-value>)`];
  }),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: cores,
      fontFamily: {
        regular: ['PlusJakartaSans_400Regular'],
        medio: ['PlusJakartaSans_500Medium'],
        semi: ['PlusJakartaSans_600SemiBold'],
        negrito: ['PlusJakartaSans_700Bold'],
        extra: ['PlusJakartaSans_800ExtraBold'],
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};
