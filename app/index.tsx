import { StyleSheet, Text, View } from 'react-native';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { useSessao } from '@/hooks/useSessao';
import { sair } from '@/services/autenticacao';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Tela PROVISÓRIA de quem está logado. No passo 7 ela vira a barra de abas.
export default function TelaInicial() {
  const { sessao } = useSessao();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Olá, Focado</Text>
      <Text style={styles.texto}>Você entrou como {sessao?.user.email}</Text>
      <View style={styles.botao}>
        <BotaoPrincipal titulo="Sair" onPress={sair} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: cores.fundo,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 32,
    color: cores.texto,
  },
  texto: {
    fontFamily: fontes.texto,
    fontSize: 16,
    color: cores.textoSecundario,
  },
  botao: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
});
