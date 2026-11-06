import { useEffect, useState } from 'react';

import { verificarConexao } from '@/services/supabase';

export type StatusConexao = 'verificando' | 'conectado' | 'sem-conexao';

// Cola entre a tela e o serviço: pergunta uma vez ao Supabase se ele
// está de pé e devolve o resultado para a tela mostrar.
export function useConexaoSupabase(): StatusConexao {
  const [status, setStatus] = useState<StatusConexao>('verificando');

  useEffect(() => {
    verificarConexao().then((ok) => setStatus(ok ? 'conectado' : 'sem-conexao'));
  }, []);

  return status;
}
