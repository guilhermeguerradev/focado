import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { LIMITE_MATERIAS_FREE, podeCriarMateria } from '@/domain/materia';
import { useMaterias } from '@/hooks/useMaterias';
import { cores, sombraCard } from '@/theme/cores';
import { coresMaterias } from '@/theme/coresMaterias';
import { fontes } from '@/theme/fontes';

// "Ver todas": lista das matérias ativas para gerenciar (PRD 3.5).
// Tocar numa matéria abre a edição (onde também dá para excluir).
export default function TelaMaterias() {
  const { materias, carregando, erro } = useMaterias();
  const cabeMais = podeCriarMateria(materias.length);

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.contador}>
        {materias.length} de {LIMITE_MATERIAS_FREE} matérias no plano gratuito
      </Text>

      {carregando ? <ActivityIndicator color={cores.primaria} /> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {materias.length > 0 ? (
        <View style={[styles.lista, sombraCard]}>
          {materias.map((materia, indice) => {
            const tom = coresMaterias[materia.cor];
            return (
              <Pressable
                key={materia.id}
                onPress={() => router.push({ pathname: '/materia', params: { id: materia.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Editar ${materia.nome}`}
                style={({ pressed }) => [
                  styles.item,
                  indice > 0 && styles.itemComDivisoria,
                  pressed && styles.pressionado,
                ]}
              >
                <View style={[styles.bolinha, { backgroundColor: tom.principal }]} />
                <Text style={styles.nome} numberOfLines={1}>
                  {materia.nome}
                </Text>
                <Feather name="chevron-right" size={20} color={cores.textoApagado} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {cabeMais ? (
        <BotaoPrincipal titulo="Nova matéria" onPress={() => router.push('/materia')} />
      ) : (
        <Text style={styles.aviso}>
          Você atingiu o limite de {LIMITE_MATERIAS_FREE} matérias do plano gratuito. Para criar
          outra, exclua uma que não usa mais.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: 20,
    gap: 16,
  },
  contador: {
    fontFamily: fontes.textoNegrito,
    fontSize: 13,
    color: cores.textoApagado,
  },
  lista: {
    backgroundColor: cores.superficie,
    borderRadius: 24,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  itemComDivisoria: {
    borderTopWidth: 1,
    borderTopColor: cores.bordaNavegacao,
  },
  pressionado: {
    backgroundColor: cores.fundo,
  },
  bolinha: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nome: {
    flex: 1,
    fontFamily: fontes.textoNegrito,
    fontSize: 16,
    color: cores.texto,
  },
  aviso: {
    fontFamily: fontes.texto,
    fontSize: 14,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
  },
});
