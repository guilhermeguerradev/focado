import type { SessaoEmAndamento } from './cronometro';

// Confere um valor lido do armário do celular (AsyncStorage) antes de usar.
// O dado pode estar corrompido ou ter vindo de uma versão antiga do app:
// se qualquer campo estiver estranho, devolve null (sessão ignorada) em vez
// de deixar o app quebrar.

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length > 0;
}

function ehDataValida(valor: unknown): valor is string {
  return ehTexto(valor) && !Number.isNaN(new Date(valor).getTime());
}

function ehSegundosValidos(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
}

export function lerSessaoSalva(valor: unknown): SessaoEmAndamento | null {
  if (typeof valor !== 'object' || valor === null) return null;

  // Seguro: só diz "objeto com campos de tipo DESCONHECIDO"; cada campo é conferido abaixo.
  const { sessionId, materiaId, iniciadaEm, saldoAcumulado, status, horaInicio } = valor as Record<
    string,
    unknown
  >;

  if (!ehTexto(sessionId)) return null;
  if (!ehTexto(materiaId)) return null;
  if (!ehDataValida(iniciadaEm)) return null;
  if (!ehSegundosValidos(saldoAcumulado)) return null;

  const comum = { sessionId, materiaId, iniciadaEm, saldoAcumulado };

  if (status === 'rodando' && ehDataValida(horaInicio)) {
    return { ...comum, status: 'rodando', horaInicio };
  }
  if (status === 'pausado' && horaInicio === null) {
    return { ...comum, status: 'pausado', horaInicio: null };
  }
  return null;
}
