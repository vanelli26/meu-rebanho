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
  | 'sobre-primaria'
  | 'primaria-forte'
  // Cores fixas da marca, iguais nos dois temas (sobre fundos verdes).
  | 'creme'
  | 'creme-suave'
  | 'dourado'
  | 'grafite';

const variantes: Record<Variante, string> = {
  display: 'font-extra text-[26px] leading-[32px] tracking-tight',
  titulo: 'font-negrito text-[20px] leading-[26px] tracking-tight',
  subtitulo: 'font-semi text-[16px] leading-[21px]',
  corpo: 'font-regular text-[15px] leading-[21px]',
  rotulo: 'font-semi text-[13px] leading-[18px]',
  legenda: 'font-medio text-[12px] leading-[16px]',
  numero: 'font-extra text-[22px] leading-[26px] tracking-tight',
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
  'primaria-forte': 'text-primaria-forte',
  creme: 'text-[#F7F4EC]',
  'creme-suave': 'text-[#F7F4EC]/75',
  dourado: 'text-[#C9A227]',
  grafite: 'text-[#1C1F1D]',
};

export type TextoProps = TextProps & {
  variante?: Variante;
  /** Cor do texto. Não passe cor por className: a do tom prevalece. */
  tom?: Tom;
  className?: string;
};

const grupo = (classe: string): string | null => {
  if (/^font-(regular|medio|semi|negrito|extra)$/.test(classe)) return 'fonte';
  if (/^text-\[\d+px\]$/.test(classe)) return 'tamanho';
  if (classe.startsWith('leading-')) return 'entrelinha';
  if (classe.startsWith('tracking-')) return 'espacamento';
  return null;
};

/** Classes da variante, sem as que o `className` sobrescreve (fonte, tamanho...). */
export function mesclarClasses(daVariante: string, extra: string): string {
  const sobrescritos = new Set(extra.split(/\s+/).map(grupo).filter(Boolean));
  const base = daVariante.split(/\s+/).filter((c) => !sobrescritos.has(grupo(c)));
  return [...base, extra].join(' ').trim();
}

/** Texto com a tipografia do app (Plus Jakarta Sans). Use no lugar de `Text`. */
export type { Tom as TomTexto };

export function Texto({
  variante = 'corpo',
  tom = 'normal',
  className = '',
  ...props
}: TextoProps) {
  return (
    <Text className={`${mesclarClasses(variantes[variante], className)} ${tons[tom]}`} {...props} />
  );
}
