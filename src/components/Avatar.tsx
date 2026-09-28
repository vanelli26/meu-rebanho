import { useState } from 'react';
import { Image, View } from 'react-native';

import { Texto } from './ui/Texto';

type Props = { nome: string; fotoUrl: string | null; tamanho?: number };

/**
 * Foto do usuário sobre as iniciais. Usa o `Image` do React Native: o do expo-image
 * sumia no iOS quando a aba saía de vista e voltava. Sem foto, sem rede ou com
 * erro, ficam as iniciais.
 */
export function Avatar({ nome, fotoUrl, tamanho = 44 }: Props) {
  const [falhou, setFalhou] = useState(false);
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
      <Texto variante="rotulo" tom="primaria">
        {iniciais || '?'}
      </Texto>
      {fotoUrl && !falhou ? (
        <Image
          source={{ uri: fotoUrl, cache: 'force-cache' }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          onError={() => setFalhou(true)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}
