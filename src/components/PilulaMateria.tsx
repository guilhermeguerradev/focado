import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CorMateria } from '@/domain/materia';
import { raio } from '@/theme/cores';
import { coresMaterias } from '@/theme/coresMaterias';
import { fontes } from '@/theme/fontes';

type Props = {
  nome: string;
  cor: CorMateria;
  onPress?: () => void;
  selecionada?: boolean; // destaque: fundo cheio na cor da matéria
};

// "Pílula" colorida de matéria, como no design: bolinha + nome.
// Selecionada, ganha fundo cheio e texto branco (como a 1ª pílula do design).
export function PilulaMateria({ nome, cor, onPress, selecionada = false }: Props) {
  const tom = coresMaterias[cor];
  const fundo = selecionada ? tom.principal : tom.fundo;
  const corTexto = selecionada ? '#FFFFFF' : tom.texto;
  const corBolinha = selecionada ? '#FFFFFF' : tom.principal;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Matéria ${nome}`}
      accessibilityState={{ selected: selecionada }}
      style={({ pressed }) => [
        styles.pilula,
        { backgroundColor: fundo },
        pressed && styles.pressionada,
      ]}
    >
      <View style={[styles.bolinha, { backgroundColor: corBolinha }]} />
      <Text style={[styles.nome, { color: corTexto }]} numberOfLines={1}>
        {nome}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: raio,
    // Nome comprido não estica a pílula: passou disso, vira "…".
    maxWidth: 170,
  },
  pressionada: {
    opacity: 0.7,
  },
  bolinha: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nome: {
    fontFamily: fontes.textoNegrito,
    fontSize: 13,
    flexShrink: 1,
  },
});
