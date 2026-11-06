import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrincipal } from '@/components/BotaoPrincipal';
import { formatarMinutos } from '@/domain/meta';
import { usePerfil } from '@/hooks/usePerfil';
import { sair } from '@/services/autenticacao';
import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Aba Perfil (versão básica da Etapa 1): nome, fuso e botão Sair.
// Avatar, ofensiva, amigos e matérias chegam na Etapa 7.
export default function AbaPerfil() {
  const { perfil, carregando, erro } = usePerfil();

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <Text style={styles.titulo}>Perfil</Text>

      {carregando ? <ActivityIndicator color={cores.primaria} style={styles.carregando} /> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      {perfil ? (
        <View style={styles.card}>
          <Text style={styles.nome}>{perfil.nome}</Text>
          <View style={styles.linha}>
            <Feather name="target" size={16} color={cores.textoSecundario} />
            <Text style={styles.detalhe}>
              Meta diária: {formatarMinutos(perfil.meta_diaria_minutos)}
            </Text>
          </View>
          <View style={styles.linha}>
            <Feather name="globe" size={16} color={cores.textoSecundario} />
            <Text style={styles.detalhe}>Fuso: {perfil.fuso}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.rodape}>
        <BotaoPrincipal titulo="Sair" onPress={sair} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingHorizontal: 20,
    gap: 16,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 26,
    color: cores.texto,
    marginTop: 12,
  },
  carregando: {
    marginTop: 24,
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    color: cores.erro,
  },
  card: {
    backgroundColor: cores.superficie,
    borderRadius: raio,
    padding: 20,
    gap: 8,
  },
  nome: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: cores.texto,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalhe: {
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.textoSecundario,
  },
  rodape: {
    marginTop: 'auto',
    marginBottom: 16,
  },
});
