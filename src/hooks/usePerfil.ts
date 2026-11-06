import { useEffect, useState } from 'react';

import { buscarMeuPerfil, type Perfil } from '@/services/perfil';

export type EstadoPerfil = {
  perfil: Perfil | null;
  carregando: boolean;
  erro: string | null;
};

// Cola entre as telas e o serviço: busca o perfil uma vez ao abrir a tela.
export function usePerfil(): EstadoPerfil {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarMeuPerfil()
      .then(setPerfil)
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return { perfil, carregando, erro };
}
