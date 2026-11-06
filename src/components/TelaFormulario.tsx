import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
};

// Moldura das telas de Entrar e Cadastro: título, subtítulo e o formulário.
// Sobe o conteúdo quando o teclado abre, para o campo não ficar escondido.
export function TelaFormulario({ titulo, subtitulo, children }: Props) {
  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAvoidingView
        style={styles.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={styles.marca}>Focado</Text>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.subtitulo}>{subtitulo}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  marca: {
    fontFamily: fontes.titulo,
    fontSize: 40,
    color: cores.primaria,
    textAlign: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 26,
    color: cores.texto,
  },
  subtitulo: {
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.textoSecundario,
    marginBottom: 8,
  },
});
