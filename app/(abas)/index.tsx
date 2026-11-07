import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CabecalhoInicio } from '@/components/CabecalhoInicio';
import { CartaoCronometro } from '@/components/CartaoCronometro';
import { CartaoTempoHoje } from '@/components/CartaoTempoHoje';
import { PopupMetaDiaria } from '@/components/PopupMetaDiaria';
import { SecaoMaterias } from '@/components/SecaoMaterias';
import { META_PADRAO_MINUTOS } from '@/domain/meta';
import { useCronometro } from '@/hooks/useCronometro';
import { useMaterias } from '@/hooks/useMaterias';
import { usePerfil } from '@/hooks/usePerfil';
import { useTempoHoje } from '@/hooks/useTempoHoje';
import { cores } from '@/theme/cores';

// Aba Estudar (tela inicial), na ordem do design:
// cabeçalho → cronômetro → tempo estudado hoje → matérias.
// Também mostra, uma única vez, o pop-up da meta diária (PRD 1.4).
export default function AbaEstudar() {
  const { perfil, responderPopupMeta } = usePerfil();
  const { materias, carregando, erro } = useMaterias();
  const cronometro = useCronometro();
  const tempoHoje = useTempoHoje(); // também envia a fila offline (PRD 3.6)
  const [escolhidaId, setEscolhidaId] = useState<string | null>(null);

  // Matéria do cronômetro: a da sessão em andamento; senão a escolhida nas
  // pílulas; senão a primeira da lista (como no design, sempre há uma em destaque).
  const sessao = cronometro.sessao;
  const idDaVez =
    sessao?.materiaId ??
    (materias.some((m) => m.id === escolhidaId) ? escolhidaId : (materias[0]?.id ?? null));
  const materiaDaVez = materias.find((m) => m.id === idDaVez) ?? null;

  function selecionarMateria(id: string) {
    if (sessao) {
      Alert.alert(
        'Sessão em andamento',
        'Para estudar outra matéria, finalize esta sessão no botão ⏹ ao lado do ▶.',
      );
      return;
    }
    setEscolhidaId(id);
  }

  // Hoje = sessões já salvas (servidor + fila offline) + a sessão em andamento.
  const segundosHoje = tempoHoje.segundosSalvos + cronometro.segundos;

  const metaMinutos = perfil?.meta_diaria_minutos ?? META_PADRAO_MINUTOS;
  const mostrarPopup = perfil !== null && perfil.meta_escolhida_em === null;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        {/* Ofensiva: 0 até a Etapa 6, quando o servidor passa a calcular. */}
        <CabecalhoInicio nome={perfil?.nome ?? ''} ofensiva={0} />
        <CartaoCronometro
          cronometro={cronometro}
          materia={materiaDaVez}
          temMaterias={materias.length > 0}
          metaMinutos={metaMinutos}
          aoFinalizarSessao={tempoHoje.sincronizar}
        />
        <CartaoTempoHoje segundosHoje={segundosHoje} metaMinutos={metaMinutos} />
        <SecaoMaterias
          materias={materias}
          carregando={carregando}
          erro={erro}
          selecionadaId={idDaVez}
          aoSelecionar={selecionarMateria}
        />
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
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 26,
    gap: 16,
  },
});
