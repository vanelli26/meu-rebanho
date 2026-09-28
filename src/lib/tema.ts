/** Cores do tema para APIs que não aceitam className (navegação, ícones). Espelha tailwind.config.js. */
export const cores = {
  fundo: '#FFFFFF',
  superficie: '#F2F4F3',
  borda: '#5C6360',
  texto: '#111412',
  textoSuave: '#3D4441',
  primaria: '#0B5D1E',
  perigo: '#A4161A',
  atencao: '#7A4A00',
} as const;

export const opcoesCabecalho = {
  headerStyle: { backgroundColor: cores.fundo },
  headerTintColor: cores.texto,
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 22 },
  headerShadowVisible: true,
};
