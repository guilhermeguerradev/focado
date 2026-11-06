import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = {
  titulo: string;
  onPress: () => void;
  carregando?: boolean; // mostra a "rodinha" e bloqueia novos toques
};

// Botão turquesa de ação principal (ex.: "Entrar", "Criar conta").
export function BotaoPrincipal({ titulo, onPress, carregando = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      accessibilityRole="button"
      style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
    >
      {carregando ? (
        <ActivityIndicator color={cores.superficie} />
      ) : (
        <Text style={styles.titulo}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: cores.primaria,
    borderRadius: raio,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pressionado: {
    backgroundColor: cores.primariaEscura,
  },
  titulo: {
    fontFamily: fontes.textoExtraNegrito,
    fontSize: 16,
    color: cores.superficie,
  },
});
