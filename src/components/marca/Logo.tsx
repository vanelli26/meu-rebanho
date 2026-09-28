import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { marca } from '@/lib/tema';

type Props = {
  tamanho?: number;
  corTraco?: string;
  corChifre?: string;
};

/** Cabeça de vaca minimalista. Mesmo desenho de assets/images/marca.svg. */
export function Logo({ tamanho = 96, corTraco = marca.creme, corChifre = marca.dourado }: Props) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="80 80 352 352">
      <G fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M194 170 C152 168 132 136 150 102" stroke={corChifre} strokeWidth={22} />
        <Path d="M318 170 C360 168 380 136 362 102" stroke={corChifre} strokeWidth={22} />
        <Path
          d="M178 214 C148 202 116 206 96 226 C120 244 154 242 178 230"
          stroke={corTraco}
          strokeWidth={20}
        />
        <Path
          d="M334 214 C364 202 396 206 416 226 C392 244 358 242 334 230"
          stroke={corTraco}
          strokeWidth={20}
        />
        <Path
          d="M256 150 C316 150 340 176 336 214 C332 250 318 276 322 300 C346 316 346 392 256 398 C166 392 166 316 190 300 C194 276 180 250 176 214 C172 176 196 150 256 150 Z"
          stroke={corTraco}
          strokeWidth={22}
        />
        <Path d="M196 308 Q256 290 316 308" stroke={corTraco} strokeWidth={18} />
      </G>
      <G fill={corTraco}>
        <Circle cx={218} cy={238} r={12} />
        <Circle cx={294} cy={238} r={12} />
        <Ellipse cx={230} cy={352} rx={10} ry={14} />
        <Ellipse cx={282} cy={352} rx={10} ry={14} />
      </G>
    </Svg>
  );
}
