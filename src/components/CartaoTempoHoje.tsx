import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { formatarHorasMinutos, progressoDaMeta } from '@/domain/inicio';
import { cores, sombraCard } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = {
  segundosHoje: number;
  metaMinutos: number;
};

// Card "Tempo estudado hoje" do design: total / meta e barra em degradê.
// Etapa 3: conta só a sessão em andamento. Com as sessões salvas (Etapa 4),
// passa a somar o dia inteiro.
export function CartaoTempoHoje({ segundosHoje, metaMinutos }: Props) {
  const progresso = progressoDaMeta(segundosHoje, metaMinutos);

  return (
    <View style={[styles.cartao, sombraCard]}>
      <View style={styles.topo}>
        <Text style={styles.rotulo}>Tempo estudado hoje</Text>
        <Text style={styles.valor}>
          {formatarHorasMinutos(segundosHoje)}{' '}
          <Text style={styles.meta}>/ {formatarHorasMinutos(metaMinutos * 60)}</Text>
        </Text>
      </View>

      <View style={styles.trilha}>
        {progresso > 0 ? (
          <Svg width={`${progresso * 100}%`} height="100%">
            <Defs>
              <LinearGradient id="degradeTurquesa" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={cores.primaria} />
                <Stop offset="1" stopColor={cores.primariaEscura} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={6} fill="url(#degradeTurquesa)" />
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  rotulo: {
    fontFamily: fontes.textoNegrito,
    fontSize: 12,
    color: cores.textoApagado,
  },
  valor: {
    fontFamily: fontes.tituloLeve,
    fontSize: 15,
    color: cores.texto,
  },
  meta: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: cores.textoApagado,
  },
  trilha: {
    height: 9,
    borderRadius: 6,
    backgroundColor: cores.trilha,
    overflow: 'hidden',
  },
});
