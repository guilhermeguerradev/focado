import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

import { cores } from '@/theme/cores';

type Props = {
  cor: string; // cor da matéria (botão central)
  mostrarPausa: boolean; // true = ícone de pausa; false = ícone de play
  centralDesabilitado: boolean;
  aoTocarCentral: () => void;
  aoFinalizar: (() => void) | null; // null = sem sessão, botão de finalizar some
};

// Botões redondos do design: central grande (66px) na cor da matéria,
// e o cinza (46px) de finalizar. Um espaço vazio à esquerda mantém o
// botão central no meio, como no design.
export function BotoesCronometro({
  cor,
  mostrarPausa,
  centralDesabilitado,
  aoTocarCentral,
  aoFinalizar,
}: Props) {
  return (
    <View style={styles.linha}>
      <View style={styles.espaco} />

      <Pressable
        onPress={aoTocarCentral}
        disabled={centralDesabilitado}
        accessibilityRole="button"
        accessibilityLabel={mostrarPausa ? 'Pausar' : 'Iniciar ou retomar'}
        style={({ pressed }) => [
          styles.central,
          { backgroundColor: cor, boxShadow: `0 12px 22px -8px ${cor}B3` },
          pressed && styles.pressionado,
          centralDesabilitado && styles.desabilitado,
        ]}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24">
          {mostrarPausa ? (
            <>
              <Rect x={6} y={5} width={4} height={14} rx={1.5} fill="#FFFFFF" />
              <Rect x={14} y={5} width={4} height={14} rx={1.5} fill="#FFFFFF" />
            </>
          ) : (
            <Polygon points="7 4 20 12 7 20" fill="#FFFFFF" />
          )}
        </Svg>
      </Pressable>

      {aoFinalizar ? (
        <Pressable
          onPress={aoFinalizar}
          accessibilityRole="button"
          accessibilityLabel="Finalizar sessão"
          style={({ pressed }) => [styles.lateral, pressed && styles.pressionado]}
        >
          <Feather name="square" size={18} color={cores.textoSecundario} />
        </Pressable>
      ) : (
        <View style={styles.espaco} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  espaco: {
    width: 46,
    height: 46,
  },
  central: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lateral: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: cores.botaoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: {
    opacity: 0.8,
  },
  desabilitado: {
    opacity: 0.4,
  },
});
