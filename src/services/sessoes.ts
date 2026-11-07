import type { SessaoFinalizada } from '@/domain/cronometro';

import { supabase } from './supabase';

// Conversa com o SERVIDOR sobre sessões de estudo (PRD 3.6).

// Resultado de um envio:
// - confirmada: o servidor gravou (ou já tinha essa sessão) → sai da fila
// - recusada:   o servidor recusou por REGRA (não adianta tentar de novo) → sai da fila
// - falhou:     sem internet / servidor fora → fica na fila e tenta depois
export type ResultadoEnvio = 'confirmada' | 'recusada' | 'falhou';

// Códigos de recusa DEFINITIVA (ver migration criar_sessao_estudo):
// FC002 curta, FC003 matéria inválida, FC004 futuro, FC005 id de outra pessoa,
// 23P01 sobreposta, 23514 regra da tabela, 22023 valor inválido.
const RECUSAS_DEFINITIVAS = ['FC002', 'FC003', 'FC004', 'FC005', '23P01', '23514', '22023'];

export async function enviarSessao(sessao: SessaoFinalizada): Promise<ResultadoEnvio> {
  try {
    const { error } = await supabase.rpc('finalizar_sessao', {
      id_sessao: sessao.sessionId,
      id_materia: sessao.materiaId,
      iniciada_em: sessao.iniciadaEm,
      duracao_segundos: sessao.duracaoSegundos,
    });
    if (!error) return 'confirmada';
    return RECUSAS_DEFINITIVAS.includes(error.code) ? 'recusada' : 'falhou';
  } catch {
    return 'falhou'; // ex.: sem internet
  }
}

// Soma (em segundos) das sessões de HOJE já gravadas no servidor,
// calculada pelo próprio servidor no fuso do usuário.
export async function buscarTempoEstudadoHoje(): Promise<number> {
  const { data, error } = await supabase.rpc('tempo_estudado_hoje');
  if (error || typeof data !== 'number') {
    throw new Error('Não consegui buscar o tempo estudado hoje.');
  }
  return data;
}
