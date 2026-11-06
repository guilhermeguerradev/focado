// Regras de matérias (PRD 3.5 e 8.2). Funções puras, sem banco nem tela.

// As 8 cores da paleta, pelo NOME (o mesmo que o banco guarda).
export const CORES_MATERIA = [
  'roxo',
  'turquesa',
  'laranja',
  'amarelo',
  'verde',
  'rosa',
  'azul',
  'vermelho',
] as const;

export type CorMateria = (typeof CORES_MATERIA)[number];

export const NOME_MATERIA_MAXIMO = 40;

// Limite do plano gratuito. Quem decide de verdade é o servidor;
// aqui serve só para a tela avisar antes (ex.: esconder o "+ Nova").
export const LIMITE_MATERIAS_FREE = 4;

// Confere se um texto é uma das 8 cores. Útil para dados vindos de fora.
export function ehCorMateria(valor: string): valor is CorMateria {
  return (CORES_MATERIA as readonly string[]).includes(valor);
}

// Devolve a mensagem de erro do nome, ou undefined se estiver ok.
export function validarNomeMateria(nome: string): string | undefined {
  const limpo = nome.trim();
  if (limpo === '') return 'Dê um nome para a matéria.';
  if (limpo.length > NOME_MATERIA_MAXIMO) {
    return `O nome pode ter no máximo ${NOME_MATERIA_MAXIMO} caracteres.`;
  }
  return undefined;
}

// true se ainda cabe mais uma matéria no plano gratuito.
export function podeCriarMateria(totalAtivas: number): boolean {
  return totalAtivas < LIMITE_MATERIAS_FREE;
}
