import { useEffect, useState, type RefObject } from 'react';
import { AppState } from 'react-native';

import { registrarSaida, registrarVolta } from '@/domain/ausencia';
import { PRAZO_FORA_DO_APP_SEGUNDOS, type SessaoEmAndamento } from '@/domain/cronometro';
import { agendarAvisosDeSaida, cancelarAvisosDeSaida } from '@/services/notificacoes';

type Parametros = {
  // "Caixinha" com a sessão ATUAL (o ouvinte do AppState é criado uma vez só).
  sessaoAtual: RefObject<SessaoEmAndamento | null>;
  // Salva no celular e mostra na tela (do useCronometro).
  trocarSessao: (nova: SessaoEmAndamento) => Promise<void>;
  // Redesenha o relógio da tela.
  atualizarRelogio: () => void;
};

export type EstadoAusencia = {
  aoVoltar: () => Promise<void>; // também usado ao abrir o app
  pausadaPorAusencia: boolean; // ficou mais de 1h fora e a sessão foi pausada
  dispensarAvisoDeAusencia: () => void;
};

// Regra "sair do app com o cronômetro rodando" (PRD 3.4.1), do lado do celular:
// detecta saída e volta da tela, agenda/cancela as notificações e avisa a
// tela quando a sessão foi pausada. As REGRAS em si ficam em
// src/domain/ausencia.ts (testadas).
export function useAusenciaDoApp({
  sessaoAtual,
  trocarSessao,
  atualizarRelogio,
}: Parametros): EstadoAusencia {
  const [pausadaPorAusencia, setPausadaPorAusencia] = useState(false);

  // Voltou para a tela (ou o app foi reaberto): aplica a regra de 1h fora.
  async function aoVoltar() {
    await cancelarAvisosDeSaida();
    const atual = sessaoAtual.current;
    if (!atual) return;
    const volta = registrarVolta(atual, new Date());
    if (volta.sessao !== atual) await trocarSessao(volta.sessao);
    if (volta.pausadaPorAusencia) setPausadaPorAusencia(true);
    atualizarRelogio();
  }

  // Saiu da tela com o cronômetro rodando: anota a hora e agenda os avisos.
  async function aoSair() {
    const atual = sessaoAtual.current;
    if (__DEV__) console.log('[cronômetro] app saiu da tela; sessão:', atual?.status ?? 'nenhuma');
    if (!atual) return;
    const fora = registrarSaida(atual, new Date());
    if (fora === atual || fora.saiuEm === null) return;
    await trocarSessao(fora);
    await agendarAvisosDeSaida(new Date(fora.saiuEm), PRAZO_FORA_DO_APP_SEGUNDOS);
  }

  // Saiu da tela / voltou para a tela.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') aoSair();
      if (estado === 'active') aoVoltar();
    });
    return () => assinatura.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouvinte criado uma vez; usa a "caixinha"
  }, []);

  return {
    aoVoltar,
    pausadaPorAusencia,
    dispensarAvisoDeAusencia: () => setPausadaPorAusencia(false),
  };
}
