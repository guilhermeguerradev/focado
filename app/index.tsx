import { StyleSheet, Text, View } from 'react-native';

// Tela inicial provisória da Etapa 0.
// Serve só para provar que o app abre no celular.
export default function TelaInicial() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Olá, Focado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
