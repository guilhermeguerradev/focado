import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { CampoTexto } from '@/components/CampoTexto';
import { SeletorDeCor } from '@/components/SeletorDeCor';
import { NOME_MATERIA_MAXIMO, validarNomeMateria, type CorMateria } from '@/domain/materia';
import { arquivarMateria, buscarMateria, criarMateria, editarMateria } from '@/services/materias';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Criar matéria (sem id) ou editar matéria existente (com id).
export default function TelaMateria() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = typeof id === 'string';

  const [nome, setNome] = useState('');
  const [cor, setCor] = useState<CorMateria>('turquesa');
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Editando: busca os dados atuais da matéria para preencher o formulário.
  useEffect(() => {
    if (!editando) return;
    buscarMateria(id)
      .then((materia) => {
        setNome(materia.nome);
        setCor(materia.cor);
      })
      .catch((e: Error) => setErroGeral(e.message));
  }, [editando, id]);

  async function salvar() {
    const erro = validarNomeMateria(nome);
    setErroNome(erro);
    setErroGeral(null);
    if (erro) return;

    setEnviando(true);
    try {
      if (editando) {
        await editarMateria(id, nome, cor);
      } else {
        await criarMateria(nome, cor);
      }
      router.back();
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  function confirmarExclusao() {
    if (!editando) return;
    Alert.alert(
      'Excluir matéria?',
      'Ela some das suas listas, mas o tempo que você já estudou continua nas estatísticas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            arquivarMateria(id)
              .then(() => router.back())
              .catch((e: Error) => setErroGeral(e.message));
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Stack.Screen options={{ title: editando ? 'Editar matéria' : 'Nova matéria' }} />

      <CampoTexto
        rotulo="Nome"
        value={nome}
        onChangeText={setNome}
        erro={erroNome}
        placeholder="Ex.: Inglês, Cálculo, Direito Penal"
        autoCapitalize="sentences"
        maxLength={NOME_MATERIA_MAXIMO}
      />

      <View style={styles.bloco}>
        <Text style={styles.rotulo}>Cor</Text>
        <SeletorDeCor valor={cor} aoMudar={setCor} />
      </View>

      {erroGeral ? <Text style={styles.erroGeral}>{erroGeral}</Text> : null}

      <BotaoPrincipal titulo="Salvar" onPress={salvar} carregando={enviando} />

      {editando ? (
        <Pressable onPress={confirmarExclusao} disabled={enviando} style={styles.excluir}>
          <Text style={styles.textoExcluir}>Excluir matéria</Text>
        </Pressable>
      ) : null}
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
    gap: 20,
  },
  bloco: {
    gap: 10,
  },
  rotulo: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.texto,
  },
  erroGeral: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
    textAlign: 'center',
  },
  excluir: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textoExcluir: {
    fontFamily: fontes.textoNegrito,
    fontSize: 15,
    color: cores.erro,
  },
});
