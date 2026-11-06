import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { cores } from '@/theme/cores';

type Props = {
  tamanho?: number; // diâmetro do círculo (o design usa 48)
};

// Avatar padrão do design: panda sobre círculo turquesa.
// Os avatares para escolher chegam na Etapa 7.
export function AvatarPanda({ tamanho = 48 }: Props) {
  const desenho = tamanho * 0.875; // no design: panda de 42px num círculo de 48px

  return (
    <View style={[styles.circulo, { width: tamanho, height: tamanho, borderRadius: tamanho / 2 }]}>
      <Svg width={desenho} height={desenho} viewBox="0 0 100 100">
        <Circle cx={28} cy={26} r={13} fill={cores.texto} />
        <Circle cx={72} cy={26} r={13} fill={cores.texto} />
        <Circle cx={50} cy={54} r={33} fill="#FFFFFF" />
        <Ellipse cx={37} cy={50} rx={8.5} ry={11} fill={cores.texto} />
        <Ellipse cx={63} cy={50} rx={8.5} ry={11} fill={cores.texto} />
        <Circle cx={38} cy={51} r={3.3} fill="#FFFFFF" />
        <Circle cx={62} cy={51} r={3.3} fill="#FFFFFF" />
        <Ellipse cx={50} cy={67} rx={4.6} ry={3.2} fill={cores.texto} />
        <Path
          d="M44 74 Q50 79 56 74"
          stroke={cores.texto}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    backgroundColor: cores.primaria,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
