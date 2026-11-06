import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CORES_MATERIA, type CorMateria } from '@/domain/materia';
import { cores } from '@/theme/cores';
import { coresMaterias } from '@/theme/coresMaterias';

type Props = {
  valor: CorMateria;
  aoMudar: (cor: CorMateria) => void;
};

// As 8 bolinhas da paleta (PRD 3.5). A escolhida ganha um "visto".
export function SeletorDeCor({ valor, aoMudar }: Props) {
  return (
    <View style={styles.linha}>
      {CORES_MATERIA.map((cor) => {
        const escolhida = cor === valor;
        return (
          <Pressable
            key={cor}
            onPress={() => aoMudar(cor)}
            accessibilityRole="radio"
            accessibilityLabel={`Cor ${cor}`}
            accessibilityState={{ checked: escolhida }}
            style={[
              styles.bolinha,
              { backgroundColor: coresMaterias[cor].principal },
              escolhida && styles.escolhida,
            ]}
          >
            {escolhida ? <Feather name="check" size={20} color={cores.superficie} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bolinha: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escolhida: {
    borderWidth: 3,
    borderColor: cores.texto,
  },
});
