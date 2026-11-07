import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { formatarCronometro, formatarDuracaoSessao } from '@/domain/cronometro';
import { voltasDaMeta } from '@/domain/inicio';
import { mensagemDoCronometro, resumoAoFinalizar } from '@/domain/mensagemCronometro';
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
  aoFinalizarSessao: () => void;
};

// Card do cronômetro, como no design: anel na cor da matéria (enche conforme
// a meta diária), tempo no meio e botões redondos.
export function CartaoCronometro({
  cronometro,
  materia,
  temMaterias,
  metaMinutos,
  aoFinalizarSessao,
}: Props) {
  const { sessao, segundos, noTeto, erro, pausadaPorAusencia, dispensarAvisoDeAusencia } =
    cronometro;

  // Ficou mais de 1h fora do app (PRD 3.4.1): explica por que pausou.
  useEffect(() => {
    if (!pausadaPorAusencia) return;
    Alert.alert(
      'Sessão pausada ⏸️',
      'Você ficou mais de 1h fora do app, então pausamos a sessão quando completou 1h fora. Toque ▶ para continuar.',
    );
    dispensarAvisoDeAusencia();
  }, [pausadaPorAusencia, dispensarAvisoDeAusencia]);
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
    const { titulo, mensagem: texto } = resumoAoFinalizar(
      resultado.destino,
      formatarDuracaoSessao(resultado.sessao.duracaoSegundos),
      materia?.nome ?? 'uma matéria arquivada',
    );
    Alert.alert(titulo, texto);
    aoFinalizarSessao(); // atualiza o "Tempo estudado hoje"
  }

  // Anel: cada volta = uma meta diária. A volta atual enche por cima da
  // anterior, alternando tom principal (1ª, 3ª...) e tom escuro (2ª, 4ª...).
  // O anel começa do ZERO a cada sessão (o dia inteiro fica no card "Tempo estudado hoje").
  const { voltasCompletas, progressoDaVolta } = voltasDaMeta(segundos, metaMinutos);
  const corDaVolta = (indice: number) => (indice % 2 === 0 ? tom.principal : tom.escuro);
  const corPorBaixo = voltasCompletas > 0 ? corDaVolta(voltasCompletas - 1) : tom.fundo;

  return (
    <View style={[styles.cartao, sombraCard]}>
      <AnelProgresso
        tamanho={210}
        espessura={19}
        progresso={progressoDaVolta}
        cor={corDaVolta(voltasCompletas)}
        corTrilha={corPorBaixo}
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
