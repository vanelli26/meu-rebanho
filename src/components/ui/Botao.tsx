import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Variante = 'primaria' | 'secundaria' | 'perigo';

const estilos: Record<Variante, { fundo: string; texto: string; indicador: string }> = {
  primaria: {
    fundo: 'bg-primaria active:bg-primaria-escura',
    texto: 'text-primaria-contraste',
    indicador: '#FFFFFF',
  },
  secundaria: {
    fundo: 'bg-fundo border-2 border-primaria active:bg-superficie',
    texto: 'text-primaria',
    indicador: '#0B5D1E',
  },
  perigo: {
    fundo: 'bg-perigo active:opacity-80',
    texto: 'text-white',
    indicador: '#FFFFFF',
  },
};

type Props = Omit<PressableProps, 'children'> & {
  titulo: string;
  variante?: Variante;
  carregando?: boolean;
  className?: string;
};

export function Botao({
  titulo,
  variante = 'primaria',
  carregando = false,
  disabled,
  className = '',
  ...props
}: Props) {
  const estilo = estilos[variante];
  const desativado = disabled || carregando;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado, busy: carregando }}
      disabled={desativado}
      className={`min-h-toque items-center justify-center rounded-xl px-5 py-3 ${estilo.fundo} ${
        desativado ? 'opacity-50' : ''
      } ${className}`}
      {...props}
    >
      {carregando ? (
        <ActivityIndicator color={estilo.indicador} />
      ) : (
        <Text className={`text-lg font-bold ${estilo.texto}`}>{titulo}</Text>
      )}
    </Pressable>
  );
}
