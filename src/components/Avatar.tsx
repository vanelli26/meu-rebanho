import { Image } from 'expo-image';
import { View } from 'react-native';

import { Texto } from './ui/Texto';

type Props = { nome: string; fotoUrl: string | null; tamanho?: number };

export function Avatar({ nome, fotoUrl, tamanho = 44 }: Props) {
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border-2 border-destaque bg-primaria-suave"
      style={{ width: tamanho, height: tamanho }}
    >
      {fotoUrl ? (
        <Image
          source={{ uri: fotoUrl }}
          style={{ width: '100%', height: '100%' }}
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Texto variante="rotulo" tom="primaria">
          {iniciais || '?'}
        </Texto>
      )}
    </View>
  );
}
