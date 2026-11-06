import { Feather } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, formatarDuracaoSessao } from '@/domain/cronometro';
import { progressoDaMeta } from '@/domain/inicio';
import { mensagemDoCronometro } from '@/domain/mensagemCronometro';
import type { EstadoCronometro } from '@/hooks/useCronometro';
import type { Materia } from '@/services/materias';
import { cores, sombraCard } from '@/theme/cores';
import { coresMaterias } from '@/theme/coresMaterias';
import { fontes } from '@/theme/fontes';

import { AnelProgresso } from './AnelProgresso';
import { BotoesCronometro } from './BotoesCronometro';

type Props = {
  cronometro: EstadoCronometro;
  materia: Materia | null; // matéria da sessão, ou a escolhida nas pílulas
  temMaterias: boolean;
  metaMinutos: number;
};

// Card do cronômetro, como no design: anel na cor da matéria (enche conforme
// a meta diária), tempo no meio e botões redondos.
export function CartaoCronometro({ cronometro, materia, temMaterias, metaMinutos }: Props) {
  const { sessao, segundos, noTeto, erro } = cronometro;
  const tom = coresMaterias[materia?.cor ?? 'turquesa'];
  const rodando = sessao?.status === 'rodando';

  const mensagem = mensagemDoCronometro({
    temMaterias,
    temMateriaEscolhida: materia !== null,
    status: sessao ? sessao.status : 'parado',
    noTeto,
  });

  function tocarCentral() {
    if (!sessao) {
      if (materia) cronometro.iniciar(materia.id);
    } else if (rodando) {
      cronometro.pausar();
    } else {
      cronometro.retomar();
    }
  }

  function confirmarFinalizar() {
    Alert.alert('Finalizar sessão?', 'Depois de finalizada, a sessão não pode ser retomada.', [
      { text: 'Continuar estudando', style: 'cancel' },
      { text: 'Finalizar', onPress: finalizarEMostrarResumo },
    ]);
  }

  async function finalizarEMostrarResumo() {
    const resultado = await cronometro.finalizar();
    if (!resultado) return;
    const nome = materia?.nome ?? 'uma matéria arquivada';
    Alert.alert(
      'Sessão finalizada 🎉',
      `Você estudou ${formatarDuracaoSessao(resultado.duracaoSegundos)} de ${nome}.`,
    );
  }

  return (
    <View style={[styles.cartao, sombraCard]}>
      <AnelProgresso
        tamanho={210}
        espessura={19}
        progresso={progressoDaMeta(segundos, metaMinutos)}
        cor={tom.principal}
        corTrilha={tom.fundo}
      >
        <View style={styles.miolo}>
          <View style={[styles.iconeRelogio, { backgroundColor: tom.fundo }]}>
            <Feather name="clock" size={17} color={tom.principal} />
          </View>
          <Text style={styles.tempo} accessibilityRole="timer">
            {formatarCronometro(segundos)}
          </Text>
          <Text
            style={[styles.mensagem, { color: noTeto ? cores.erro : tom.principal }]}
            numberOfLines={2}
          >
            {mensagem}
          </Text>
        </View>
      </AnelProgresso>

      <BotoesCronometro
        cor={tom.principal}
        mostrarPausa={rodando}
        centralDesabilitado={noTeto || (!sessao && !materia)}
        aoTocarCentral={tocarCentral}
        aoFinalizar={sessao ? confirmarFinalizar : null}
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: 'center',
    gap: 14,
  },
  miolo: {
    width: 172,
    alignItems: 'center',
    gap: 3,
  },
  iconeRelogio: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tempo: {
    fontFamily: fontes.tituloLeve,
    fontSize: 46,
    letterSpacing: 1,
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  mensagem: {
    fontFamily: fontes.textoNegrito,
    fontSize: 13,
    textAlign: 'center',
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
    textAlign: 'center',
  },
});
