import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { cores, raio } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

type Props = TextInputProps & {
  rotulo: string; // texto acima do campo, ex.: "E-mail"
  erro?: string; // mensagem em vermelho abaixo do campo
};

// Campo de formulário: rótulo + caixa de texto + mensagem de erro.
export function CampoTexto({ rotulo, erro, style, ...propsDoInput }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        style={[styles.input, erro ? styles.inputComErro : null, style]}
        placeholderTextColor={cores.textoApagado}
        {...propsDoInput}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  rotulo: {
    fontFamily: fontes.textoNegrito,
    fontSize: 14,
    color: cores.texto,
  },
  input: {
    fontFamily: fontes.texto,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.borda,
    borderRadius: raio,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputComErro: {
    borderColor: cores.erro,
  },
  erro: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.erro,
  },
});
