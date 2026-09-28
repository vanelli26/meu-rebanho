import { View, type ViewProps } from 'react-native';

import { useTema } from '@/lib/tema';

type Props = ViewProps & { className?: string };

export function Card({ className = '', style, ...props }: Props) {
  const { escuro } = useTema();
  const sombra = escuro
    ? undefined
    : { boxShadow: '0px 6px 24px rgba(28, 31, 29, 0.07), 0px 1px 3px rgba(28, 31, 29, 0.05)' };

  return (
    <View
      className={`gap-3 rounded-3xl bg-superficie p-5 ${escuro ? 'border border-borda' : ''} ${className}`}
      style={[sombra, style]}
      {...props}
    />
  );
}
