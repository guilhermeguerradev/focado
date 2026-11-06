import { StyleSheet, Text, View } from 'react-native';

import { useConexaoSupabase, type StatusConexao } from '@/hooks/useConexaoSupabase';

const TEXTO_STATUS: Record<StatusConexao, string> = {
  verificando: 'Verificando banco...',
  conectado: 'Banco conectado ✅',
  'sem-conexao': 'Sem conexão com o banco ❌',
};

// Tela inicial provisória da Etapa 0.
// Prova que o app abre no celular e consegue falar com o Supabase local.
export default function TelaInicial() {
  const status = useConexaoSupabase();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Olá, Focado</Text>
      <Text style={styles.status}>{TEXTO_STATUS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
  },
});
