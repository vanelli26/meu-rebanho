import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** Colinas de pasto em camadas, para o rodapé de telas da marca. */
export function Paisagem({ altura = 260 }: { altura?: number }) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { top: undefined, height: altura }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="none">
        <Circle cx={318} cy={78} r={34} fill="#C9A227" opacity={0.22} />
        <Path
          d="M0 120 C80 80 160 90 230 120 C300 150 350 130 400 110 V260 H0 Z"
          fill="#2A6049"
          opacity={0.55}
        />
        <Path
          d="M0 160 C90 130 170 140 250 165 C320 186 360 172 400 160 V260 H0 Z"
          fill="#245641"
          opacity={0.8}
        />
        <Path
          d="M0 205 C100 180 200 190 280 208 C340 220 370 214 400 206 V260 H0 Z"
          fill="#173A2C"
        />
      </Svg>
    </View>
  );
}
