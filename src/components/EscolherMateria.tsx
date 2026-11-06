import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Materia } from '@/services/materias';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { BotaoPrincipal } from './BotaoPrincipal';
import { PilulaMateria } from './PilulaMateria';

type Props = {
  materias: Materia[];
  aoIniciar: (materiaId: string) => Promise<void>;
};

// Antes de começar: escolher a matéria (obrigatório, PRD 3.1) e iniciar.
export function EscolherMateria({ materias, aoIniciar }: Props) {
  const [escolhidaId, setEscolhidaId] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);

  if (materias.length === 0) {
    return (
      <Text style={styles.dica}>
        Cadastre uma matéria em &quot;Matérias&quot;, logo abaixo, para começar a estudar.
      </Text>
    );
  }

  async function iniciar() {
    if (!escolhidaId) return;
    setIniciando(true);
    await aoIniciar(escolhidaId);
    setIniciando(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pergunta}>O que você vai estudar agora?</Text>
      <View style={styles.pilulas}>
        {materias.map((materia) => (
          <PilulaMateria
            key={materia.id}
            nome={materia.nome}
            cor={materia.cor}
            selecionada={materia.id === escolhidaId}
            onPress={() => setEscolhidaId(materia.id)}
          />
        ))}
      </View>
      {escolhidaId ? (
        <BotaoPrincipal titulo="Iniciar" onPress={iniciar} carregando={iniciando} />
      ) : (
        <Text style={styles.dica}>Toque numa matéria para escolher.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  pergunta: {
    fontFamily: fontes.tituloLeve,
    fontSize: 17,
    color: cores.texto,
  },
  pilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  dica: {
    fontFamily: fontes.texto,
    fontSize: 14,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
});
