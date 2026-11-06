import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatarMinutos, META_PADRAO_MINUTOS, OPCOES_META_MINUTOS } from '@/domain/meta';
import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { BotaoPrincipal } from './BotaoPrincipal';

type Props = {
  visivel: boolean;
  // Chamado com os minutos escolhidos, ou null se a pessoa pulou.
  aoResponder: (minutos: number | null) => Promise<void>;
};

// Pop-up da meta diária, mostrado uma única vez após o primeiro login (PRD 1.4).
export function PopupMetaDiaria({ visivel, aoResponder }: Props) {
  const [escolhida, setEscolhida] = useState<number>(META_PADRAO_MINUTOS);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function responder(minutos: number | null) {
    setEnviando(true);
    setErro(null);
    try {
      await aoResponder(minutos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visivel} transparent animationType="fade">
      <View style={styles.fundoEscuro}>
        <View style={styles.cartao}>
          <Text style={styles.titulo}>Qual é a sua meta diária? 🎯</Text>
          <Text style={styles.subtitulo}>
            Quanto tempo você quer estudar por dia? Bater a meta mantém sua ofensiva 🔥 acesa.
          </Text>

          <View style={styles.opcoes}>
            {OPCOES_META_MINUTOS.map((minutos) => {
              const selecionada = minutos === escolhida;
              return (
                <Pressable
                  key={minutos}
                  onPress={() => setEscolhida(minutos)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selecionada }}
                  style={[styles.opcao, selecionada && styles.opcaoSelecionada]}
                >
                  <Text style={[styles.textoOpcao, selecionada && styles.textoSelecionado]}>
                    {formatarMinutos(minutos)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <BotaoPrincipal
            titulo="Confirmar"
            onPress={() => responder(escolhida)}
            carregando={enviando}
          />
          <Pressable onPress={() => responder(null)} disabled={enviando} style={styles.pular}>
            <Text style={styles.textoPular}>
              Pular por agora (fica {formatarMinutos(META_PADRAO_MINUTOS)})
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundoEscuro: {
    flex: 1,
    backgroundColor: 'rgba(26, 29, 31, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: cores.texto,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  opcao: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: raio,
    borderWidth: 1.5,
    borderColor: cores.borda,
    alignItems: 'center',
  },
  opcaoSelecionada: {
    borderColor: cores.primaria,
    backgroundColor: cores.primaria,
  },
  textoOpcao: {
    fontFamily: fontes.textoExtraNegrito,
    fontSize: 16,
    color: cores.texto,
  },
  textoSelecionado: {
    color: cores.superficie,
  },
  erro: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.erro,
    textAlign: 'center',
  },
  pular: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  textoPular: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.textoSecundario,
  },
});
