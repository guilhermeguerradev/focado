import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

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
import { gerarId } from '@/services/identificador';
import { carregarSessaoLocal, limparSessaoLocal, salvarSessaoLocal } from '@/services/sessaoLocal';

export type EstadoCronometro = {
  sessao: SessaoEmAndamento | null; // null = nenhuma sessão em andamento
  segundos: number; // tempo decorrido, já com o teto de 12h
  noTeto: boolean; // chegou a 12h?
  carregando: boolean; // lendo a sessão guardada no celular
  erro: string | null;
  iniciar: (materiaId: string) => Promise<void>;
  pausar: () => Promise<void>;
  retomar: () => Promise<void>;
  finalizar: () => Promise<SessaoFinalizada | null>;
};

// Cola entre a tela e as regras do cronômetro.
// - As REGRAS ficam em src/domain/cronometro.ts (testadas).
// - Cada mudança é SALVA no celular antes de aparecer na tela.
// - O "tique" de 1s só redesenha a tela: o tempo é sempre calculado.
export function useCronometro(): EstadoCronometro {
  const [sessao, setSessao] = useState<SessaoEmAndamento | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Ao abrir: existe sessão guardada? (app fechado à força, celular reiniciado...)
  useEffect(() => {
    carregarSessaoLocal()
      .then(setSessao)
      .catch(() => setErro('Não consegui ler o cronômetro salvo.'))
      .finally(() => setCarregando(false));
  }, []);

  // Enquanto roda, atualiza o "agora" a cada segundo para a tela redesenhar.
  const rodando = sessao?.status === 'rodando';
  useEffect(() => {
    if (!rodando) return;
    const tique = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(tique);
  }, [rodando]);

  // Voltou para o app (estava em segundo plano)? Atualiza na hora.
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setAgora(new Date());
    });
    return () => assinatura.remove();
  }, []);

  // Salva primeiro; só depois mostra. Se salvar falhar, a tela não "mente".
  async function trocarSessao(nova: SessaoEmAndamento) {
    try {
      await salvarSessaoLocal(nova);
      setSessao(nova);
      setAgora(new Date());
      setErro(null);
    } catch {
      setErro('Não consegui salvar o cronômetro. Tente de novo.');
    }
  }

  async function iniciar(materiaId: string) {
    await trocarSessao(iniciarSessao({ sessionId: gerarId(), materiaId, agora: new Date() }));
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
    setSessao(null);
    return resultado;
  }

  return {
    sessao,
    segundos: sessao ? tempoDecorrido(sessao, agora) : 0,
    noTeto: sessao ? atingiuTeto(sessao, agora) : false,
    carregando,
    erro,
    iniciar,
    pausar,
    retomar,
    finalizar,
  };
}
