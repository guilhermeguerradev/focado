import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  tamanho: number; // diâmetro externo (design: 210)
  espessura: number; // largura do anel (design: 19 = (210 - 172) / 2)
  progresso: number; // de 0 a 1
  cor: string; // parte preenchida
  corTrilha: string; // parte que falta
  children?: ReactNode; // conteúdo no meio do anel
};

// Anel de progresso, como o "conic-gradient" do design.
// Truque: um círculo com contorno tracejado, onde o "traço" tem o tamanho
// do progresso e o "espaço" é o resto da volta.
export function AnelProgresso({ tamanho, espessura, progresso, cor, corTrilha, children }: Props) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = circunferencia * Math.min(1, Math.max(0, progresso));
  const centro = tamanho / 2;

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Svg width={tamanho} height={tamanho}>
        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={corTrilha}
          strokeWidth={espessura}
          fill="none"
        />
        {/* Gira -90° para o preenchimento começar no topo, como um relógio. */}
        <Circle
          cx={centro}
          cy={centro}
          r={raio}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeDasharray={`${preenchido} ${circunferencia}`}
          transform={`rotate(-90 ${centro} ${centro})`}
        />
      </Svg>
      <View style={styles.meio}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  meio: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
