import { View, type ViewProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTema } from '@/lib/tema';

type Props = ViewProps & {
  className?: string;
  /** Ordem na tela, para a entrada em cascata. `undefined` desliga a animação. */
  indice?: number;
};

export function Card({ className = '', style, indice, ...props }: Props) {
  const { escuro } = useTema();
  const sombra = escuro
    ? undefined
    : { boxShadow: '0px 6px 24px rgba(28, 31, 29, 0.07), 0px 1px 3px rgba(28, 31, 29, 0.05)' };

  const conteudo = (
    <View
      className={`gap-3 rounded-3xl bg-superficie p-5 ${escuro ? 'border border-borda' : ''} ${className}`}
      style={[sombra, style]}
      {...props}
    />
  );

  if (indice === undefined) return conteudo;
  return (
    <Animated.View
      entering={FadeInDown.delay(60 * indice)
        .springify()
        .damping(18)}
    >
      {conteudo}
    </Animated.View>
  );
}
