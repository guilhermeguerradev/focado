import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '@/services/supabase';

export type EstadoSessao = {
  sessao: Session | null; // null = ninguém logado
  carregando: boolean; // true enquanto lê o login guardado no celular
};

// Diz para as telas se há alguém logado, e avisa sozinho quando isso muda
// (entrou, saiu, crachá renovado).
export function useSessao(): EstadoSessao {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // 1) Ao abrir o app: tem login guardado no celular?
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });

    // 2) Daqui pra frente: avise sempre que o login mudar.
    const { data } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao);
    });

    // Ao sair da tela, para de escutar (evita vazamento de memória).
    return () => data.subscription.unsubscribe();
  }, []);

  return { sessao, carregando };
}
