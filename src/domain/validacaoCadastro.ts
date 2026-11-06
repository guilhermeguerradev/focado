// Regras de validação do cadastro e do login (PRD 1.4).
// Funções puras: recebem os dados digitados e devolvem os erros encontrados.
// Servem para a EXPERIÊNCIA (avisar na hora). Quem decide de verdade é o servidor,
// que confere as mesmas regras de novo.

export const NOME_MAXIMO = 255;
export const SENHA_MINIMA = 8;

export type DadosCadastro = { nome: string; email: string; senha: string };
export type DadosLogin = { email: string; senha: string };

// Cada campo com problema recebe uma mensagem; campo sem problema não aparece.
export type ErrosFormulario = Partial<Record<'nome' | 'email' | 'senha', string>>;

// Formato simples: algo@algo.algo, sem espaços.
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarEmail(email: string): string | undefined {
  if (email.trim() === '') return 'Informe seu e-mail.';
  if (!FORMATO_EMAIL.test(email.trim())) return 'E-mail inválido.';
  return undefined;
}

export function validarCadastro(dados: DadosCadastro): ErrosFormulario {
  const erros: ErrosFormulario = {};
  const nome = dados.nome.trim();

  if (nome === '') {
    erros.nome = 'Informe seu nome.';
  } else if (nome.length > NOME_MAXIMO) {
    erros.nome = `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`;
  }

  const erroEmail = validarEmail(dados.email);
  if (erroEmail) erros.email = erroEmail;

  if (dados.senha.length < SENHA_MINIMA) {
    erros.senha = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  }

  return erros;
}

export function validarLogin(dados: DadosLogin): ErrosFormulario {
  const erros: ErrosFormulario = {};

  const erroEmail = validarEmail(dados.email);
  if (erroEmail) erros.email = erroEmail;

  if (dados.senha === '') erros.senha = 'Informe sua senha.';

  return erros;
}

// true quando não há nenhum erro.
export function semErros(erros: ErrosFormulario): boolean {
  return Object.keys(erros).length === 0;
}
