// Mensagem que aparece dentro do anel do cronômetro, para cada situação.
// Função pura e testada: cada situação tem a SUA mensagem, sem "cair" na
// regra de outra situação por engano.

export type SituacaoCronometro = {
  temMaterias: boolean; // o usuário já cadastrou alguma matéria?
  temMateriaEscolhida: boolean; // há uma matéria selecionada nas pílulas?
  status: 'parado' | 'rodando' | 'pausado'; // parado = nenhuma sessão em andamento
  noTeto: boolean; // a sessão chegou às 12h?
};

export function mensagemDoCronometro(situacao: SituacaoCronometro): string {
  const { temMaterias, temMateriaEscolhida, status, noTeto } = situacao;

  if (status === 'parado') {
    if (!temMaterias) return 'Cadastre uma matéria abaixo';
    if (!temMateriaEscolhida) return 'Escolha uma matéria abaixo';
    return 'Bora estudar';
  }

  if (noTeto) return 'Teto de 12h atingido — finalize';
  if (status === 'pausado') return 'Pausado';
  return 'Concentre-se!';
}

// O que aconteceu com a sessão ao finalizar (PRD 3.6):
// - salva: chegou ao servidor
// - na_fila: sem internet, vai ser enviada depois
// - curta: menos de 1 minuto, não é salva
// - recusada: o servidor recusou por regra (ex.: horário sobreposto)
export type DestinoDaSessao = 'salva' | 'na_fila' | 'curta' | 'recusada';

export function resumoAoFinalizar(
  destino: DestinoDaSessao,
  duracaoTexto: string, // ex.: "25 min"
  nomeMateria: string,
): { titulo: string; mensagem: string } {
  const estudou = `Você estudou ${duracaoTexto} de ${nomeMateria}.`;
  switch (destino) {
    case 'salva':
      return { titulo: 'Sessão salva 🎉', mensagem: estudou };
    case 'na_fila':
      return {
        titulo: 'Sessão finalizada 🎉',
        mensagem: `${estudou} Sem internet agora: vamos enviar quando a conexão voltar.`,
      };
    case 'curta':
      return {
        titulo: 'Sessão muito curta',
        mensagem: 'Sessões com menos de 1 minuto não são salvas.',
      };
    case 'recusada':
      return {
        titulo: 'Sessão não salva',
        mensagem: 'O servidor recusou esta sessão (ex.: horário sobreposto a outra sessão).',
      };
  }
}
