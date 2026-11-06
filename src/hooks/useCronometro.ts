import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { registrarSaida, registrarVolta } from '@/domain/ausencia';
import {
  atingiuTeto,
  finalizar as finalizarSessao,
  iniciarSessao,
  pausar as pausarSessao,
  PRAZO_FORA_DO_APP_SEGUNDOS,
  retomar as retomarSessao,
  tempoDecorrido,
  type SessaoEmAndamento,
  type SessaoFinalizada,
} from '@/domain/cronometro';
import { gerarId } from '@/services/identificador';
import {
  agendarAvisosDeSaida,
  cancelarAvisosDeSaida,
  prepararNotificacoes,
} from '@/services/notificacoes';
import { carregarSessaoLocal, limparSessaoLocal, salvarSessaoLocal } from '@/services/sessaoLocal';

export type EstadoCronometro = {
  sessao: SessaoEmAndamento | null; // null = nenhuma sessão em andamento
  segundos: number; // tempo decorrido, já com o teto de 12h e o limite de 1h fora
  noTeto: boolean; // chegou a 12h?
  carregando: boolean; // lendo a sessão guardada no celular
  erro: string | null;
  pausadaPorAusencia: boolean; // ficou mais de 1h fora e a sessão foi pausada (PRD 3.4.1)
  dispensarAvisoDeAusencia: () => void;
  iniciar: (materiaId: string) => Promise<void>;
  pausar: () => Promise<void>;
  retomar: () => Promise<void>;
  finalizar: () => Promise<SessaoFinalizada | null>;
};

// Cola entre a tela e as regras do cronômetro.
// - As REGRAS ficam em src/domain (cronometro.ts e ausencia.ts), testadas.
// - Cada mudança é SALVA no celular antes de aparecer na tela.
// - O "tique" de 1s só redesenha a tela: o tempo é sempre calculado.
export function useCronometro(): EstadoCronometro {
  const [sessao, setSessao] = useState<SessaoEmAndamento | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pausadaPorAusencia, setPausadaPorAusencia] = useState(false);

  // "Caixinha" com a sessão ATUAL, para o ouvinte do AppState (criado uma
  // vez só) não enxergar uma versão velha da sessão.
  const sessaoAtual = useRef<SessaoEmAndamento | null>(null);

  function mostrar(nova: SessaoEmAndamento | null) {
    sessaoAtual.current = nova;
    setSessao(nova);
    setAgora(new Date());
  }

  // Salva primeiro; só depois mostra. Se salvar falhar, a tela não "mente".
  async function trocarSessao(nova: SessaoEmAndamento) {
    try {
      await salvarSessaoLocal(nova);
      mostrar(nova);
      setErro(null);
    } catch {
      setErro('Não consegui salvar o cronômetro. Tente de novo.');
    }
  }

  // Voltou para a tela (ou o app foi reaberto): aplica a regra de 1h fora.
  async function aoVoltar() {
    await cancelarAvisosDeSaida();
    const atual = sessaoAtual.current;
    if (!atual) return;
    const volta = registrarVolta(atual, new Date());
    if (volta.sessao !== atual) await trocarSessao(volta.sessao);
    if (volta.pausadaPorAusencia) setPausadaPorAusencia(true);
    setAgora(new Date());
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

  // Ao abrir: existe sessão guardada? (app fechado à força, celular reiniciado...)
  useEffect(() => {
    carregarSessaoLocal()
      .then((salva) => {
        sessaoAtual.current = salva;
        setSessao(salva);
        return aoVoltar();
      })
      .catch(() => setErro('Não consegui ler o cronômetro salvo.'))
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda só ao abrir
  }, []);

  // Enquanto roda, atualiza o "agora" a cada segundo para a tela redesenhar.
  const rodando = sessao?.status === 'rodando';
  useEffect(() => {
    if (!rodando) return;
    const tique = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(tique);
  }, [rodando]);

  // Saiu da tela / voltou para a tela.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'background') aoSair();
      if (estado === 'active') aoVoltar();
    });
    return () => assinatura.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ouvinte criado uma vez; usa a "caixinha"
  }, []);

  async function iniciar(materiaId: string) {
    await trocarSessao(iniciarSessao({ sessionId: gerarId(), materiaId, agora: new Date() }));
    // Pede permissão de notificação na 1ª vez (para o aviso de 1h fora).
    prepararNotificacoes();
  }

  async function pausar() {
    if (sessao) await trocarSessao(pausarSessao(sessao, new Date()));
  }

  async function retomar() {
    if (sessao) await trocarSessao(retomarSessao(sessao, new Date()));
  }

  async function finalizar(): Promise<SessaoFinalizada | null> {
    if (!sessao) return null;
    const resultado = finalizarSessao(sessao, new Date());
    await limparSessaoLocal();
    mostrar(null);
    return resultado;
  }

  return {
    sessao,
    segundos: sessao ? tempoDecorrido(sessao, agora) : 0,
    noTeto: sessao ? atingiuTeto(sessao, agora) : false,
    carregando,
    erro,
    pausadaPorAusencia,
    dispensarAvisoDeAusencia: () => setPausadaPorAusencia(false),
    iniciar,
    pausar,
    retomar,
    finalizar,
  };
}
