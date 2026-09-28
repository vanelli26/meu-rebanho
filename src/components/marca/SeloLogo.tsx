import { LinearGradient } from 'expo-linear-gradient';

import { marca } from '@/lib/tema';

import { Logo } from './Logo';

/** Logo dentro do quadrado arredondado verde, igual ao ícone do app. */
export function SeloLogo({ tamanho = 88 }: { tamanho?: number }) {
  return (
    <LinearGradient
      colors={[marca.verdeClaro, marca.verdeEscuro]}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho * 0.28,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 10px 30px rgba(23, 58, 44, 0.35)',
      }}
    >
      <Logo tamanho={tamanho * 0.78} />
    </LinearGradient>
  );
}
