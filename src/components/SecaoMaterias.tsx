import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LIMITE_MATERIAS_FREE, podeCriarMateria } from '@/domain/materia';
import { useMaterias } from '@/hooks/useMaterias';
import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { PilulaMateria } from './PilulaMateria';

// Seção "Matérias" da aba Estudar: pílulas coloridas + botão "Nova".
// Tocar numa pílula abre a edição; "Nova" abre a criação.
export function SecaoMaterias() {
  const { materias, carregando, erro } = useMaterias();
  const cabeMais = podeCriarMateria(materias.length);

  return (
    <View style={styles.secao}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Matérias</Text>
        <Text style={styles.contador}>
          {materias.length}/{LIMITE_MATERIAS_FREE}
        </Text>
      </View>

      {carregando ? <ActivityIndicator color={cores.primaria} /> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {!carregando && materias.length === 0 && !erro ? (
        <Text style={styles.vazio}>Cadastre as matérias que você estuda para começar.</Text>
      ) : null}

      <View style={styles.pilulas}>
        {materias.map((materia) => (
          <PilulaMateria
            key={materia.id}
            nome={materia.nome}
            cor={materia.cor}
            onPress={() => router.push({ pathname: '/materia', params: { id: materia.id } })}
          />
        ))}

        {cabeMais && !carregando ? (
          <Pressable
            onPress={() => router.push('/materia')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nova, pressed && styles.pressionada]}
          >
            <Feather name="plus" size={14} color={cores.primaria} />
            <Text style={styles.textoNova}>Nova</Text>
          </Pressable>
        ) : null}
      </View>

      {!cabeMais ? (
        <Text style={styles.aviso}>
          Limite de {LIMITE_MATERIAS_FREE} matérias do plano gratuito atingido.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: 10,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontFamily: fontes.tituloLeve,
    fontSize: 17,
    color: cores.texto,
  },
  contador: {
    fontFamily: fontes.textoNegrito,
    fontSize: 13,
    color: cores.textoApagado,
  },
  pilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  vazio: {
    fontFamily: fontes.texto,
    fontSize: 14,
    color: cores.textoSecundario,
  },
  aviso: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.textoSecundario,
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
  },
});
