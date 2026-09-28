import { useColorScheme } from 'react-native';

/**
 * Paleta "Campo premium": verde-floresta, creme e dourado-trigo.
 * Fonte única das cores: o Tailwind lê as variáveis CSS geradas daqui
 * (`varsDoTema`) e as APIs sem className (navegação, ícones, SVG) usam `useTema()`.
 */
export const paletas = {
  claro: {
    fundo: '#F7F4EC',
    superficie: '#FFFFFF',
    superficie2: '#EFEBE0',
    borda: '#E3DDCD',
    texto: '#1C1F1D',
    textoSuave: '#5E655F',
    primaria: '#1F4D3A',
    primariaForte: '#173A2C',
    primariaSuave: '#E3EDE6',
    sobrePrimaria: '#F7F4EC',
    destaque: '#C9A227',
    destaqueSuave: '#F6EDCF',
    perigo: '#B3261E',
    perigoSuave: '#FBE9E7',
    atencao: '#9A6412',
    atencaoSuave: '#FDF3DC',
    sucesso: '#2F7D4F',
    sucessoSuave: '#E4F3EA',
    info: '#2D6A8F',
    infoSuave: '#E3EFF6',
  },
  escuro: {
    fundo: '#0F1512',
    superficie: '#18201C',
    superficie2: '#212B26',
    borda: '#2C3832',
    texto: '#EEF1EC',
    textoSuave: '#9BA7A0',
    primaria: '#5DB287',
    primariaForte: '#4A9A72',
    primariaSuave: '#1D3329',
    sobrePrimaria: '#0F1512',
    destaque: '#D9B84A',
    destaqueSuave: '#3A3219',
    perigo: '#F2877E',
    perigoSuave: '#3B1D1B',
    atencao: '#E9B563',
    atencaoSuave: '#3A2E18',
    sucesso: '#6FCB94',
    sucessoSuave: '#1B3325',
    info: '#7DB8DC',
    infoSuave: '#1A2C38',
  },
} as const;

export type Paleta = { [K in keyof (typeof paletas)['claro']]: string };
export type NomeCor = keyof Paleta;

/** Cores fixas da marca (logo, splash, login), iguais nos dois temas. */
export const marca = {
  verde: '#1F4D3A',
  verdeClaro: '#2A6049',
  verdeEscuro: '#173A2C',
  creme: '#F7F4EC',
  dourado: '#C9A227',
} as const;

export function useTema(): { escuro: boolean; cores: Paleta } {
  const escuro = useColorScheme() === 'dark';
  return { escuro, cores: escuro ? paletas.escuro : paletas.claro };
}

const paraKebab = (nome: string) => nome.replace(/[A-Z0-9]/g, (c) => `-${c.toLowerCase()}`);

const paraRGB = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** `{ '--primaria-suave': '227 237 230', ... }` para o `vars()` do NativeWind. */
export function varsDoTema(paleta: Paleta): Record<`--${string}`, string> {
  return Object.fromEntries(
    Object.entries(paleta).map(([nome, hex]) => [`--${paraKebab(nome)}`, paraRGB(hex)]),
  );
}

export const fontes = {
  regular: 'PlusJakartaSans_400Regular',
  medio: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  negrito: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
} as const;
