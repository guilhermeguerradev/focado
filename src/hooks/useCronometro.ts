import { useEffect, useRef, useState } from 'react';

import {
  atingiuTeto,
  finalizar as finalizarSessao,
  iniciarSessao,
  pausar as pausarSessao,
  retomar as retomarSessao,
  tempoDecorrido,
  type SessaoEmAndamento,
  type SessaoFinalizada,
} from '@/domain/cronometro';
import type { DestinoDaSessao } from '@/domain/mensagemCronometro';
import { salvarSessaoFinalizada } from '@/services/filaSessoes';
import { gerarId } from '@/services/identificador';
import { prepararNotificacoes } from '@/services/notificacoes';
import { carregarSessaoLocal, limparSessaoLocal, salvarSessaoLocal } from '@/services/sessaoLocal';

import { useAusenciaDoApp } from './useAusenciaDoApp';

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
  finalizar: () => Promise<SessaoFinalizadaComDestino | null>;
};

export type SessaoFinalizadaComDestino = {
  sessao: SessaoFinalizada;
  destino: DestinoDaSessao; // salva, na fila, curta ou recusada
};

// Cola entre a tela e as regras do cronômetro.
// - As REGRAS ficam em src/domain (cronometro.ts e ausencia.ts), testadas.
// - Cada mudança é SALVA no celular antes de aparecer na tela.
// - O "tique" de 1s só redesenha a tela: o tempo é sempre calculado.
// - Sair/voltar do app (regra de 1h): useAusenciaDoApp.
// - O que fazer com a sessão finalizada (fila/envio): salvarSessaoFinalizada.
export function useCronometro(): EstadoCronometro {
  const [sessao, setSessao] = useState<SessaoEmAndamento | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

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

  const ausencia = useAusenciaDoApp({
    sessaoAtual,
    trocarSessao,
    atualizarRelogio: () => setAgora(new Date()),
  });

  // Ao abrir: existe sessão guardada? (app fechado à força, celular reiniciado...)
  // Se existir, aplica a regra de 1h fora antes de mostrar.
  useEffect(() => {
    carregarSessaoLocal()
      .then((salva) => {
        sessaoAtual.current = salva;
        setSessao(salva);
        return ausencia.aoVoltar();
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

  async function finalizar(): Promise<SessaoFinalizadaComDestino | null> {
    if (!sessao) return null;
    const resultado = finalizarSessao(sessao, new Date());
    const destino = await salvarSessaoFinalizada(resultado, async () => {
      await limparSessaoLocal();
      mostrar(null);
    });
    return { sessao: resultado, destino };
  }

  return {
    sessao,
    segundos: sessao ? tempoDecorrido(sessao, agora) : 0,
    noTeto: sessao ? atingiuTeto(sessao, agora) : false,
    carregando,
    erro,
    pausadaPorAusencia: ausencia.pausadaPorAusencia,
    dispensarAvisoDeAusencia: ausencia.dispensarAvisoDeAusencia,
    iniciar,
    pausar,
    retomar,
    finalizar,
  };
}
