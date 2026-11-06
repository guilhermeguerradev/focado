// Regras do cronômetro (PRD 3.2, 3.3 e 3.4). Funções PURAS:
// recebem o estado e o "agora", e devolvem um estado novo. Nada de relógio
// escondido, React ou AsyncStorage aqui dentro — por isso dá para testar tudo.
//
// Ideia central: o tempo nunca é "contado" (+1 a cada segundo); é CALCULADO
// a partir de horários guardados. Assim, se o app for fechado à força,
// basta ler o último estado salvo e recalcular.

// Teto de uma sessão: 12 horas (PRD 3.4).
export const TETO_SEGUNDOS = 12 * 60 * 60;

type DadosComuns = {
  sessionId: string; // gerado no celular (idempotência no servidor, Etapa 4)
  materiaId: string;
  iniciadaEm: string; // ISO/UTC do PRIMEIRO início: define o dia da sessão (PRD 3.6)
  saldoAcumulado: number; // segundos já consolidados (trechos antes da última pausa)
};

export type SessaoRodando = DadosComuns & { status: 'rodando'; horaInicio: string };
export type SessaoPausada = DadosComuns & { status: 'pausado'; horaInicio: null };
export type SessaoEmAndamento = SessaoRodando | SessaoPausada;

export type SessaoFinalizada = {
  sessionId: string;
  materiaId: string;
  iniciadaEm: string;
  duracaoSegundos: number; // inteiro, já limitado ao teto de 12h
};

// Segundos entre dois horários. Nunca negativo: se alguém voltar o relógio
// do celular para trás, o trecho conta 0 em vez de "tirar" tempo.
function segundosEntre(inicioIso: string, agora: Date): number {
  const diferencaMs = agora.getTime() - new Date(inicioIso).getTime();
  return Math.max(0, diferencaMs / 1000);
}

export function iniciarSessao(dados: {
  sessionId: string;
  materiaId: string;
  agora: Date;
}): SessaoRodando {
  const agoraIso = dados.agora.toISOString();
  return {
    status: 'rodando',
    sessionId: dados.sessionId,
    materiaId: dados.materiaId,
    iniciadaEm: agoraIso,
    horaInicio: agoraIso,
    saldoAcumulado: 0,
  };
}

// Tempo total da sessão, em segundos, já limitado ao teto.
export function tempoDecorrido(sessao: SessaoEmAndamento, agora: Date): number {
  const total =
    sessao.status === 'rodando'
      ? sessao.saldoAcumulado + segundosEntre(sessao.horaInicio, agora)
      : sessao.saldoAcumulado;
  return Math.min(total, TETO_SEGUNDOS);
}

export function atingiuTeto(sessao: SessaoEmAndamento, agora: Date): boolean {
  return tempoDecorrido(sessao, agora) >= TETO_SEGUNDOS;
}

// Pausar: consolida o trecho em andamento no saldo e "solta" o horaInicio.
// Pausar algo já pausado não muda nada.
export function pausar(sessao: SessaoEmAndamento, agora: Date): SessaoPausada {
  if (sessao.status === 'pausado') return sessao;
  return {
    ...sessao,
    status: 'pausado',
    horaInicio: null,
    saldoAcumulado: tempoDecorrido(sessao, agora),
  };
}

// Retomar: começa um trecho novo agora; o saldo continua o mesmo.
// Retomar algo que já está rodando não muda nada.
export function retomar(sessao: SessaoEmAndamento, agora: Date): SessaoRodando {
  if (sessao.status === 'rodando') return sessao;
  return { ...sessao, status: 'rodando', horaInicio: agora.toISOString() };
}

// Finalizar: duração = saldo + trecho em andamento, limitada a 12h, em segundos inteiros.
export function finalizar(sessao: SessaoEmAndamento, agora: Date): SessaoFinalizada {
  return {
    sessionId: sessao.sessionId,
    materiaId: sessao.materiaId,
    iniciadaEm: sessao.iniciadaEm,
    duracaoSegundos: Math.floor(tempoDecorrido(sessao, agora)),
  };
}

// Relógio da tela: "24:35" abaixo de 1 hora, "1:05:09" a partir de 1 hora.
export function formatarCronometro(segundos: number): string {
  const inteiro = Math.max(0, Math.floor(segundos));
  const horas = Math.floor(inteiro / 3600);
  const minutos = Math.floor((inteiro % 3600) / 60);
  const segs = inteiro % 60;
  const doisDigitos = (n: number) => String(n).padStart(2, '0');

  if (horas === 0) return `${doisDigitos(minutos)}:${doisDigitos(segs)}`;
  return `${horas}:${doisDigitos(minutos)}:${doisDigitos(segs)}`;
}
