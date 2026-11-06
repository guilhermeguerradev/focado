import { randomUUID } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { inject } from 'vitest';

// Ferramentas compartilhadas pelos testes de integração.

const opcoesSemSalvarSessao = {
  auth: { persistSession: false, autoRefreshToken: false },
};

// Cliente igual ao do app: só a chave PÚBLICA, sem ninguém logado.
export function criarClienteVisitante(): SupabaseClient {
  return createClient(inject('supabaseUrl'), inject('chavePublica'), opcoesSemSalvarSessao);
}

// Cliente "administrador": usa a chave SECRETA e ignora o RLS.
// Existe SÓ nos testes, para limpar os usuários criados. Nunca vai para o app.
function criarClienteAdmin(): SupabaseClient {
  return createClient(inject('supabaseUrl'), inject('chaveSecreta'), opcoesSemSalvarSessao);
}

export type UsuarioDeTeste = {
  id: string;
  cliente: SupabaseClient; // já logado como esse usuário
};

// Cadastra um usuário de verdade pela API (como o app faria) e devolve
// um cliente já logado como ele. E-mail aleatório: testes não se atrapalham.
export async function criarUsuarioDeTeste(
  nome: string,
  fuso = 'America/Sao_Paulo',
): Promise<UsuarioDeTeste> {
  const cliente = criarClienteVisitante();
  const { data, error } = await cliente.auth.signUp({
    email: `teste-${randomUUID()}@exemplo.com`,
    password: 'senha-de-teste-123',
    options: { data: { nome, fuso } },
  });

  if (error || !data.user) {
    throw new Error(`Não consegui criar o usuário de teste: ${error?.message}`);
  }
  return { id: data.user.id, cliente };
}

// Apaga os usuários criados no teste (o perfil vai junto, pelo "on delete cascade").
export async function apagarUsuarios(usuarios: UsuarioDeTeste[]): Promise<void> {
  const admin = criarClienteAdmin();
  for (const usuario of usuarios) {
    await admin.auth.admin.deleteUser(usuario.id);
  }
}
