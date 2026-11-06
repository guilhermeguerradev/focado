// Regra de "sair do app com o cronômetro rodando" (PRD 3.4.1). Funções puras.
//
// O app NÃO roda enquanto está fora da tela. Por isso a regra funciona assim:
// - ao SAIR, anotamos o horário (registrarSaida);
// - ao VOLTAR, fazemos a conta (registrarVolta): passou de 1h? Pausa no
//   horário em que completou 1h fora — o resultado é igual a ter pausado na hora.

import { PRAZO_FORA_DO_APP_SEGUNDOS, pausar, type SessaoEmAndamento } from './cronometro';

// O app saiu da tela. Só importa se o cronômetro estiver rodando.
// Se já havia uma saída anotada, mantém a primeira (o prazo não "renova").
export function registrarSaida(sessao: SessaoEmAndamento, agora: Date): SessaoEmAndamento {
  if (sessao.status !== 'rodando' || sessao.saiuEm !== null) return sessao;
  return { ...sessao, saiuEm: agora.toISOString() };
}

export type ResultadoVolta = {
  sessao: SessaoEmAndamento;
  pausadaPorAusencia: boolean; // true = ficou mais de 1h fora e a sessão foi pausada
};

// O app voltou para a tela (ou foi reaberto depois de fechado à força).
export function registrarVolta(sessao: SessaoEmAndamento, agora: Date): ResultadoVolta {
  if (sessao.saiuEm === null) {
    return { sessao, pausadaPorAusencia: false };
  }

  const prazoTerminaEm = new Date(
    new Date(sessao.saiuEm).getTime() + PRAZO_FORA_DO_APP_SEGUNDOS * 1000,
  );

  if (sessao.status === 'rodando' && agora > prazoTerminaEm) {
    // Pausa "no passado": conta até completar 1h fora, nem um segundo a mais.
    return { sessao: pausar(sessao, prazoTerminaEm), pausadaPorAusencia: true };
  }

  // Voltou dentro do prazo: segue normal, e a saída anotada é apagada.
  return { sessao: { ...sessao, saiuEm: null }, pausadaPorAusencia: false };
}
