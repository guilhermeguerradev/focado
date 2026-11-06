import { execSync } from 'node:child_process';

import type { TestProject } from 'vitest/node';

// Roda UMA vez, antes de todos os testes de integração.
// Pergunta ao Supabase local (npx supabase status) o endereço e as chaves,
// e entrega esses valores aos testes (via "provide").
// As chaves vêm na hora do teste: nunca ficam gravadas em arquivo nem no Git.

declare module 'vitest' {
  export interface ProvidedContext {
    supabaseUrl: string;
    chavePublica: string;
    chaveSecreta: string;
  }
}

function lerStatusDoSupabase(): Record<string, string> {
  let saida: string;
  try {
    saida = execSync('npx supabase status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error('Supabase local desligado. Abra o Docker Desktop e rode: npx supabase start');
  }

  // Cada linha vem no formato NOME="valor".
  const valores: Record<string, string> = {};
  for (const linha of saida.split('\n')) {
    const [nome, ...resto] = linha.trim().split('=');
    if (nome && resto.length > 0) {
      valores[nome] = resto.join('=').replace(/^"|"$/g, '');
    }
  }
  return valores;
}

export default function preparar(projeto: TestProject) {
  const status = lerStatusDoSupabase();

  projeto.provide('supabaseUrl', status.API_URL);
  projeto.provide('chavePublica', status.PUBLISHABLE_KEY);
  projeto.provide('chaveSecreta', status.SECRET_KEY);
}
