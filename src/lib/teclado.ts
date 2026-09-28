import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

/** `true` enquanto o teclado está aberto. */
export function useTecladoVisivel(): boolean {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const abrir = Keyboard.addListener('keyboardDidShow', () => setVisivel(true));
    const fechar = Keyboard.addListener('keyboardDidHide', () => setVisivel(false));
    return () => {
      abrir.remove();
      fechar.remove();
    };
  }, []);
  return visivel;
}
