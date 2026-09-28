import { fontes, useTema } from './tema';

/** Opções de cabeçalho das pilhas internas, no tema atual. */
export function useOpcoesCabecalho() {
  const { cores } = useTema();
  return {
    headerStyle: { backgroundColor: cores.fundo },
    headerTintColor: cores.texto,
    headerTitleStyle: { fontFamily: fontes.negrito, fontSize: 20 },
    headerLargeTitleStyle: { fontFamily: fontes.extra },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    contentStyle: { backgroundColor: cores.fundo },
    animation: 'ios_from_right' as const,
  };
}
