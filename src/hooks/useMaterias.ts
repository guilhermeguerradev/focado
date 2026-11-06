import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listarMateriasAtivas, type Materia } from '@/services/materias';

export type EstadoMaterias = {
  materias: Materia[];
  carregando: boolean;
  erro: string | null;
};

// Cola entre as telas e o serviço de matérias.
// Recarrega toda vez que a tela volta a aparecer (ex.: depois de criar uma).
export function useMaterias(): EstadoMaterias {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    listarMateriasAtivas()
      .then((lista) => {
        setMaterias(lista);
        setErro(null);
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  useFocusEffect(carregar);

  return { materias, carregando, erro };
}
