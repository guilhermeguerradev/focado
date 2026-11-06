import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { podeCriarMateria } from '@/domain/materia';
import type { Materia } from '@/services/materias';
import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { PilulaMateria } from './PilulaMateria';

type Props = {
  materias: Materia[];
  carregando: boolean;
  erro: string | null;
  selecionadaId: string | null; // pílula cheia = matéria do cronômetro
  aoSelecionar: (id: string) => void;
};

// Seção "Matérias" da tela inicial, como no design: título, "Ver todas"
// e uma linha de pílulas que rola para o lado. Tocar escolhe a matéria
// do cronômetro. Criar/editar/excluir ficam em "Ver todas".
export function SecaoMaterias({ materias, carregando, erro, selecionadaId, aoSelecionar }: Props) {
  return (
    <View>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Matérias</Text>
        <Pressable onPress={() => router.push('/materias')} accessibilityRole="link" hitSlop={8}>
          <Text style={styles.verTodas}>Ver todas</Text>
        </Pressable>
      </View>

      {carregando ? <ActivityIndicator color={cores.primaria} /> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
      >
        {materias.map((materia) => (
          <PilulaMateria
            key={materia.id}
            nome={materia.nome}
            cor={materia.cor}
            selecionada={materia.id === selecionadaId}
            onPress={() => aoSelecionar(materia.id)}
          />
        ))}

        {!carregando && podeCriarMateria(materias.length) ? (
          <Pressable
            onPress={() => router.push('/materia')}
            accessibilityRole="button"
            accessibilityLabel="Nova matéria"
            style={({ pressed }) => [styles.nova, pressed && styles.pressionada]}
          >
            <Feather name="plus" size={14} color={cores.primaria} />
            {materias.length === 0 ? <Text style={styles.textoNova}>Nova matéria</Text> : null}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titulo: {
    fontFamily: fontes.tituloLeve,
    fontSize: 15,
    color: cores.texto,
  },
  verTodas: {
    fontFamily: fontes.textoNegrito,
    fontSize: 12,
    color: cores.primaria,
  },
  linha: {
    gap: 9,
  },
  nova: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: raio,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.primaria,
  },
  pressionada: {
    opacity: 0.7,
  },
  textoNova: {
    fontFamily: fontes.textoNegrito,
    fontSize: 13,
    color: cores.primaria,
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
  },
});
