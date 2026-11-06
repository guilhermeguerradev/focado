import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartaoCronometro } from '@/components/CartaoCronometro';
import { PopupMetaDiaria } from '@/components/PopupMetaDiaria';
import { SecaoMaterias } from '@/components/SecaoMaterias';
import { useMaterias } from '@/hooks/useMaterias';
import { usePerfil } from '@/hooks/usePerfil';
import { cores } from '@/theme/cores';
import { fontes } from '@/theme/fontes';

// Aba Estudar (tela inicial).
// - Cronômetro: escolher matéria, iniciar, pausar, retomar, finalizar (PRD 3).
// - Seção "Matérias": listar, criar, editar e excluir (PRD 3.5).
// - Aparece, uma única vez, o pop-up da meta diária (PRD 1.4).
export default function AbaEstudar() {
  const { perfil, responderPopupMeta } = usePerfil();
  // Busca as matérias UMA vez e reparte com o cronômetro e a seção.
  const estadoMaterias = useMaterias();

  const mostrarPopup = perfil !== null && perfil.meta_escolhida_em === null;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>Estudar</Text>
        <CartaoCronometro materias={estadoMaterias.materias} />
        <SecaoMaterias {...estadoMaterias} />
      </ScrollView>
      <PopupMetaDiaria visivel={mostrarPopup} aoResponder={responderPopupMeta} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 26,
    color: cores.texto,
    marginTop: 12,
  },
});
