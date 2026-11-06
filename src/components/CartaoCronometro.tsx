import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, formatarDuracaoSessao } from '@/domain/cronometro';
import { useCronometro } from '@/hooks/useCronometro';
import type { Materia } from '@/services/materias';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { BotaoPrincipal } from './BotaoPrincipal';
import { BotaoSecundario } from './BotaoSecundario';
import { EscolherMateria } from './EscolherMateria';
import { PilulaMateria } from './PilulaMateria';

type Props = {
  materias: Materia[];
};

// Card do cronômetro da aba Estudar (PRD 3).
// Sem sessão: escolher matéria e iniciar. Com sessão: tempo + pausar/retomar/finalizar.
export function CartaoCronometro({ materias }: Props) {
  const cronometro = useCronometro();
  const { sessao, segundos, noTeto, carregando, erro } = cronometro;

  if (carregando) {
    return (
      <View style={styles.cartao}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }

  if (!sessao) {
    return (
      <View style={styles.cartao}>
        <EscolherMateria materias={materias} aoIniciar={cronometro.iniciar} />
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      </View>
    );
  }

  const materia = materias.find((m) => m.id === sessao.materiaId);
  const nomeMateria = materia?.nome ?? 'matéria arquivada';
  const rodando = sessao.status === 'rodando';

  function confirmarFinalizar() {
    Alert.alert('Finalizar sessão?', 'Depois de finalizada, a sessão não pode ser retomada.', [
      { text: 'Continuar estudando', style: 'cancel' },
      { text: 'Finalizar', onPress: finalizarEMostrarResumo },
    ]);
  }

  async function finalizarEMostrarResumo() {
    const resultado = await cronometro.finalizar();
    if (!resultado) return;
    Alert.alert(
      'Sessão finalizada 🎉',
      `Você estudou ${formatarDuracaoSessao(resultado.duracaoSegundos)} de ${nomeMateria}.`,
    );
  }

  let mensagem = rodando ? 'Concentre-se! 🐼' : 'Pausado';
  if (noTeto) mensagem = 'Teto de 12h atingido — finalize a sessão.';

  return (
    <View style={styles.cartao}>
      {materia ? <PilulaMateria nome={materia.nome} cor={materia.cor} selecionada /> : null}

      <Text style={styles.tempo} accessibilityRole="timer">
        {formatarCronometro(segundos)}
      </Text>
      <Text style={[styles.mensagem, noTeto && styles.mensagemTeto]}>{mensagem}</Text>

      <View style={styles.botoes}>
        {!noTeto && rodando ? <BotaoPrincipal titulo="Pausar" onPress={cronometro.pausar} /> : null}
        {!noTeto && !rodando ? (
          <BotaoPrincipal titulo="Retomar" onPress={cronometro.retomar} />
        ) : null}
        <BotaoSecundario titulo="Finalizar" onPress={confirmarFinalizar} />
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    alignItems: 'stretch',
  },
  tempo: {
    fontFamily: fontes.titulo,
    fontSize: 64,
    color: cores.texto,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  mensagem: {
    fontFamily: fontes.textoNegrito,
    fontSize: 15,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  mensagemTeto: {
    color: cores.erro,
  },
  botoes: {
    gap: 10,
    marginTop: 4,
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
    textAlign: 'center',
  },
});
