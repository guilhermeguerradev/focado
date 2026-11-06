import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { buscarMeuPerfil, definirMetaInicial, type Perfil } from '@/services/perfil';

export type EstadoPerfil = {
  perfil: Perfil | null;
  carregando: boolean;
  erro: string | null;
  // Responde o pop-up da meta (null = pulou) e atualiza o perfil na tela.
  responderPopupMeta: (minutos: number | null) => Promise<void>;
};

// Cola entre as telas e o serviço de perfil.
// Busca o perfil toda vez que a tela volta a ficar visível (ex.: trocar de aba),
// para mostrar sempre o dado mais recente.
export function usePerfil(): EstadoPerfil {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    buscarMeuPerfil()
      .then((dados) => {
        setPerfil(dados);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(carregar);

  async function responderPopupMeta(minutos: number | null) {
    await definirMetaInicial(minutos);
    carregar();
  }

  return { perfil, carregando, erro, responderPopupMeta };
}
