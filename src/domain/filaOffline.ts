// Regras da FILA OFFLINE de sessões finalizadas (PRD 3.6). Funções puras.
// A fila é como a "caixa de saída" do e-mail: a sessão entra aqui ao
// finalizar e só sai quando o servidor confirmar (ou recusar por regra).

import type { SessaoFinalizada } from './cronometro';

// Sessões com menos de 1 minuto não são salvas (PRD 3.6).
export const DURACAO_MINIMA_SEGUNDOS = 60;

export function ehCurtaDemais(sessao: SessaoFinalizada): boolean {
  return sessao.duracaoSegundos < DURACAO_MINIMA_SEGUNDOS;
}

// Adiciona no fim da fila, sem duplicar (mesmo sessionId = mesma sessão).
export function adicionarNaFila(fila: SessaoFinalizada[], sessao: SessaoFinalizada) {
  if (fila.some((item) => item.sessionId === sessao.sessionId)) return fila;
  return [...fila, sessao];
}

export function removerDaFila(fila: SessaoFinalizada[], sessionId: string) {
  return fila.filter((item) => item.sessionId !== sessionId);
}

// Soma das sessões da fila que começaram HOJE (no fuso do celular), para o
// card "Tempo estudado hoje" não "perder" o que ainda não chegou ao servidor.
export function segundosNaFilaHoje(fila: SessaoFinalizada[], agora: Date): number {
  const hoje = agora.toDateString();
  return fila
    .filter((item) => new Date(item.iniciadaEm).toDateString() === hoje)
    .reduce((soma, item) => soma + item.duracaoSegundos, 0);
}

// Confere a fila lida do armário do celular. Itens estragados são
// descartados; os bons são mantidos (um item ruim não derruba a fila inteira).
export function lerFilaSalva(valor: unknown): SessaoFinalizada[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter(ehSessaoFinalizada);
}

function ehSessaoFinalizada(valor: unknown): valor is SessaoFinalizada {
  if (typeof valor !== 'object' || valor === null) return false;
  // Seguro: só diz "objeto com campos de tipo DESCONHECIDO"; cada um é conferido.
  const { sessionId, materiaId, iniciadaEm, duracaoSegundos } = valor as Record<string, unknown>;
  return (
    typeof sessionId === 'string' &&
    sessionId.length > 0 &&
    typeof materiaId === 'string' &&
    materiaId.length > 0 &&
    typeof iniciadaEm === 'string' &&
    !Number.isNaN(new Date(iniciadaEm).getTime()) &&
    typeof duracaoSegundos === 'number' &&
    Number.isInteger(duracaoSegundos) &&
    duracaoSegundos >= 0
  );
}
