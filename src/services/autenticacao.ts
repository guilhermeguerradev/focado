import type { AuthError } from '@supabase/supabase-js';

import type { DadosCadastro, DadosLogin } from '@/domain/validacaoCadastro';

import { detectarFuso } from './fuso';
import { limparSessaoLocal } from './sessaoLocal';
import { supabase } from './supabase';

// Cadastro, login e saída, conversando com o Supabase Auth.
// Cada função devolve { erro } com uma mensagem em português, ou { erro: null }.

export type ResultadoAutenticacao = { erro: string | null };

// Traduz os códigos de erro do Supabase para mensagens que o usuário entende.
function traduzirErro(erro: AuthError): string {
  switch (erro.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'Já existe uma conta com esse e-mail.';
    case 'invalid_credentials':
      return 'E-mail ou senha incorretos.';
    case 'weak_password':
      return 'A senha precisa ter pelo menos 8 caracteres.';
    case 'over_request_rate_limit':
      return 'Muitas tentativas. Espere um pouco e tente de novo.';
  }
  if (erro.name === 'AuthRetryableFetchError') {
    return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  }
  return 'Algo deu errado. Tente de novo.';
}

export async function cadastrar(dados: DadosCadastro): Promise<ResultadoAutenticacao> {
  const { error } = await supabase.auth.signUp({
    email: dados.email.trim(),
    password: dados.senha,
    // Vai para o servidor, que cria o perfil sozinho (gatilho no banco).
    options: { data: { nome: dados.nome.trim(), fuso: detectarFuso() } },
  });
  return { erro: error ? traduzirErro(error) : null };
}

export async function entrar(dados: DadosLogin): Promise<ResultadoAutenticacao> {
  const { error } = await supabase.auth.signInWithPassword({
    email: dados.email.trim(),
    password: dados.senha,
  });
  return { erro: error ? traduzirErro(error) : null };
}

export async function sair(): Promise<void> {
  // Apaga o cronômetro guardado no celular: outra pessoa pode entrar
  // neste mesmo aparelho e não deve herdar a sessão de quem saiu.
  await limparSessaoLocal();
  await supabase.auth.signOut();
}
