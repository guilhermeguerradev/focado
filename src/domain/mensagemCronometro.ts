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
    return 'Toque ▶ para começar';
  }

  if (noTeto) return 'Teto de 12h atingido — finalize';
  if (status === 'pausado') return 'Pausado · toque ▶ para retomar';
  return 'Concentre-se!';
}
