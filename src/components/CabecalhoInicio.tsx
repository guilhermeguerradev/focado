import { StyleSheet, Text, View } from 'react-native';

import { saudacao } from '@/domain/inicio';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

import { AvatarPanda } from './AvatarPanda';

type Props = {
  nome: string;
  ofensiva: number; // dias seguidos batendo a meta (calculada no servidor na Etapa 6)
};

// Cabeçalho da tela inicial, como no design: avatar, saudação, nome e 🔥.
// (O sino de notificações do design fica fora: notificações não estão no v1.)
export function CabecalhoInicio({ nome, ofensiva }: Props) {
  return (
    <View style={styles.linha}>
      <AvatarPanda tamanho={48} />
      <View style={styles.textos}>
        <Text style={styles.saudacao}>{saudacao(new Date().getHours())},</Text>
        <Text style={styles.nome} numberOfLines={1}>
          {nome}
        </Text>
      </View>
      <View style={styles.ofensiva} accessibilityLabel={`Ofensiva de ${ofensiva} dias`}>
        <Text style={styles.fogo}>🔥</Text>
        <Text style={styles.numeroOfensiva}>{ofensiva}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  textos: {
    flex: 1,
  },
  saudacao: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: cores.textoApagado,
  },
  nome: {
    fontFamily: fontes.titulo,
    fontSize: 17,
    color: cores.texto,
  },
  ofensiva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: cores.fogoFundo,
  },
  fogo: {
    fontSize: 15,
  },
  numeroOfensiva: {
    fontFamily: fontes.textoExtraNegrito,
    fontSize: 15,
    color: cores.fogoTexto,
  },
});
