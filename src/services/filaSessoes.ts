import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessaoFinalizada } from '@/domain/cronometro';
import { adicionarNaFila, lerFilaSalva, removerDaFila } from '@/domain/filaOffline';

import { enviarSessao } from './sessoes';
import { supabase } from './supabase';

// FILA OFFLINE (PRD 3.6): a "caixa de saída" das sessões finalizadas,
// guardada no celular. Uma fila POR USUÁRIO: quem entrar no mesmo celular
// com outra conta tem outra fila, e nada se perde ao sair da conta.

async function chaveDaFila(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const usuarioId = data.session?.user.id;
  return usuarioId ? `focado:fila-sessoes:${usuarioId}` : null;
}

export async function carregarFila(): Promise<SessaoFinalizada[]> {
  const chave = await chaveDaFila();
  if (!chave) return [];
  const texto = await AsyncStorage.getItem(chave);
  if (texto === null) return [];
  try {
    return lerFilaSalva(JSON.parse(texto));
  } catch {
    return []; // texto que nem é JSON
  }
}

async function salvarFila(fila: SessaoFinalizada[]): Promise<void> {
  const chave = await chaveDaFila();
  if (!chave) return;
  await AsyncStorage.setItem(chave, JSON.stringify(fila));
}

// Uma alteração da fila por vez: cada "ler → mudar → gravar" espera o
// anterior terminar. Sem isso, duas alterações juntas poderiam ler a mesma
// versão e uma apagaria o que a outra acabou de gravar.
let ultimaAlteracao: Promise<void> = Promise.resolve();

function alterarFila(mudar: (fila: SessaoFinalizada[]) => SessaoFinalizada[]): Promise<void> {
  const alteracao = ultimaAlteracao.then(async () => {
    await salvarFila(mudar(await carregarFila()));
  });
  ultimaAlteracao = alteracao.catch(() => undefined); // um erro não trava as próximas
  return alteracao;
}

// Guarda a sessão na fila ANTES de qualquer envio: se o app morrer no
// meio do envio, ela continua guardada.
export function guardarNaFila(sessao: SessaoFinalizada): Promise<void> {
  return alterarFila((fila) => adicionarNaFila(fila, sessao));
}

export type ResumoDoEnvio = {
  confirmadas: string[]; // sessionIds gravados no servidor
  recusadas: string[]; // sessionIds recusados por regra
  pendentes: number; // quantas continuam na fila (sem internet)
};

// TRAVA: se um envio já está acontecendo, quem chegar depois espera esse
// mesmo envio terminar, em vez de começar outro em paralelo (dois envios
// juntos poderiam regravar a fila um por cima do outro).
let envioEmAndamento: Promise<ResumoDoEnvio> | null = null;

export function enviarPendentes(): Promise<ResumoDoEnvio> {
  if (!envioEmAndamento) {
    envioEmAndamento = enviarEmOrdem().finally(() => {
      envioEmAndamento = null;
    });
  }
  return envioEmAndamento;
}

// Envia uma por vez, na ordem em que foram finalizadas. Se uma falhar por
// conexão, para ali: o resto fica para a próxima tentativa.
async function enviarEmOrdem(): Promise<ResumoDoEnvio> {
  const fila = await carregarFila();
  const resumo: ResumoDoEnvio = { confirmadas: [], recusadas: [], pendentes: 0 };

  for (const sessao of fila) {
    const resultado = await enviarSessao(sessao);
    if (resultado === 'falhou') break;
    if (resultado === 'confirmada') resumo.confirmadas.push(sessao.sessionId);
    if (resultado === 'recusada') resumo.recusadas.push(sessao.sessionId);
  }

  // Tira da fila SÓ o que foi processado agora, relendo a fila atual:
  // uma sessão guardada durante o envio não pode ser apagada.
  const processadas = [...resumo.confirmadas, ...resumo.recusadas];
  await alterarFila((atual) =>
    processadas.reduce((restante, id) => removerDaFila(restante, id), atual),
  );

  resumo.pendentes = (await carregarFila()).length;
  return resumo;
}
