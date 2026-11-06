import { createClient } from '@supabase/supabase-js';

// Único lugar do app que cria a conexão com o Supabase.
// Os valores vêm do arquivo .env (que não vai para o Git).
// Lê uma variável do .env e para o app com mensagem clara se ela faltar.
// O retorno é sempre string (nunca undefined), e o TypeScript sabe disso.
function lerVariavel(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(`Falta a variável ${nome} no arquivo .env`);
  }
  return valor;
}

// O Expo só troca process.env.EXPO_PUBLIC_... pelo valor quando o nome
// está escrito por extenso assim. Por isso o nome aparece duas vezes.
const url = lerVariavel('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
const chavePublica = lerVariavel(
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Na Etapa 1 (login) vamos configurar aqui onde a sessão do usuário fica salva.
export const supabase = createClient(url, chavePublica);

// Pergunta ao servidor de autenticação se ele está de pé.
// Devolve true se respondeu, false se não deu para falar com ele.
export async function verificarConexao(): Promise<boolean> {
  try {
    const resposta = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: chavePublica },
    });
    return resposta.ok;
  } catch {
    return false;
  }
}
