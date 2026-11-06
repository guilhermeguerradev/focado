import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

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

export const supabase = createClient(url, chavePublica, {
  auth: {
    // Guarda a sessão (o "crachá" de login) no armário do celular,
    // para o usuário continuar logado depois de fechar o app.
    storage: AsyncStorage,
    persistSession: true,
    // Renova o crachá sozinho antes de ele vencer.
    autoRefreshToken: true,
    // Isso é para login pelo navegador (web); no celular não se aplica.
    detectSessionInUrl: false,
  },
});

// Só renova o crachá enquanto o app está na tela (aberto e em uso).
// Com o app em segundo plano, a renovação pausa para não gastar bateria/rede.
AppState.addEventListener('change', (estado) => {
  if (estado === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

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
