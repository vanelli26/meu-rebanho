import { Text, type TextProps } from 'react-native';

type Variante = 'display' | 'titulo' | 'subtitulo' | 'corpo' | 'rotulo' | 'legenda' | 'numero';
type Tom =
  | 'normal'
  | 'suave'
  | 'primaria'
  | 'destaque'
  | 'perigo'
  | 'atencao'
  | 'sucesso'
  | 'info'
  | 'sobre-primaria';

const variantes: Record<Variante, string> = {
  display: 'font-extra text-[32px] leading-[38px] tracking-tight',
  titulo: 'font-negrito text-[24px] leading-[30px] tracking-tight',
  subtitulo: 'font-semi text-[18px] leading-[24px]',
  corpo: 'font-regular text-[16px] leading-[23px]',
  rotulo: 'font-semi text-[14px] leading-[19px]',
  legenda: 'font-medio text-[13px] leading-[18px]',
  numero: 'font-extra text-[28px] leading-[32px] tracking-tight',
};

const tons: Record<Tom, string> = {
  normal: 'text-texto',
  suave: 'text-texto-suave',
  primaria: 'text-primaria',
  destaque: 'text-destaque',
  perigo: 'text-perigo',
  atencao: 'text-atencao',
  sucesso: 'text-sucesso',
  info: 'text-info',
  'sobre-primaria': 'text-sobre-primaria',
};

export type TextoProps = TextProps & {
  variante?: Variante;
  tom?: Tom;
  className?: string;
};

/** Texto com a tipografia do app (Plus Jakarta Sans). Use no lugar de `Text`. */
export function Texto({
  variante = 'corpo',
  tom = 'normal',
  className = '',
  ...props
}: TextoProps) {
  return <Text className={`${variantes[variante]} ${tons[tom]} ${className}`} {...props} />;
}
