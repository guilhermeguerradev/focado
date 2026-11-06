import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CorMateria } from '@/domain/materia';
import { raio } from '@/theme/cores';
import { coresMaterias } from '@/theme/coresMaterias';
import { fontes } from '@/theme/fontes';

type Props = {
  nome: string;
  cor: CorMateria;
  onPress?: () => void;
};

// "Pílula" colorida de matéria, como no design: bolinha + nome.
export function PilulaMateria({ nome, cor, onPress }: Props) {
  const tom = coresMaterias[cor];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Matéria ${nome}`}
      style={({ pressed }) => [
        styles.pilula,
        { backgroundColor: tom.fundo },
        pressed && styles.pressionada,
      ]}
    >
      <View style={[styles.bolinha, { backgroundColor: tom.principal }]} />
      <Text style={[styles.nome, { color: tom.texto }]} numberOfLines={1}>
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
    maxWidth: '100%',
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
