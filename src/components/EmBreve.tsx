import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = {
  titulo: string; // nome da aba, ex.: "Estatísticas"
};

// Tela provisória para as abas que ainda vão ser construídas.
export function EmBreve({ titulo }: Props) {
  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.centro}>
        <Text style={styles.texto}>Em breve 🐼</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingHorizontal: 20,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 26,
    color: cores.texto,
    marginTop: 12,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fontes.textoNegrito,
    fontSize: 16,
    color: cores.textoApagado,
  },
});
