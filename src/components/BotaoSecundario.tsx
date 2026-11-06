import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
};

// Botão de contorno, para a ação secundária ao lado do BotaoPrincipal.
export function BotaoSecundario({ titulo, onPress, desabilitado = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.botao,
        pressed && styles.pressionado,
        desabilitado && styles.desabilitado,
      ]}
    >
      <Text style={styles.titulo}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderWidth: 2,
    borderColor: cores.primaria,
    borderRadius: raio,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pressionado: {
    backgroundColor: cores.fundo,
  },
  desabilitado: {
    opacity: 0.5,
  },
  titulo: {
    fontFamily: fontes.textoExtraNegrito,
    fontSize: 16,
    color: cores.primaria,
  },
});
