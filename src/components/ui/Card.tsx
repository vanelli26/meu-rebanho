import { View, type ViewProps } from 'react-native';

type Props = ViewProps & { className?: string };

export function Card({ className = '', ...props }: Props) {
  return (
    <View
      className={`gap-3 rounded-2xl border-2 border-borda bg-fundo p-4 ${className}`}
      {...props}
    />
  );
}
