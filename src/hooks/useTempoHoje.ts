import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { segundosNaFilaHoje } from '@/domain/filaOffline';
import { carregarFila, enviarPendentes } from '@/services/filaSessoes';
import { buscarTempoEstudadoHoje } from '@/services/sessoes';

export type EstadoTempoHoje = {
  segundosSalvos: number; // servidor (hoje) + fila (hoje). Sem a sessão em andamento.
  sincronizar: () => Promise<void>;
};

// Sincroniza a fila offline e soma o tempo estudado HOJE.
// Roda ao abrir a tela, ao voltar para o app e quando a tela pede
// (ex.: logo depois de finalizar uma sessão). PRD 3.6.
export function useTempoHoje(): EstadoTempoHoje {
  const [doServidor, setDoServidor] = useState(0);
  const [daFila, setDaFila] = useState(0);

  const sincronizar = useCallback(async () => {
    // 1) Tenta enviar o que estiver na fila (sem internet, só falha e segue).
    await enviarPendentes();

    // 2) Soma do servidor. Sem internet, mantém o último valor conhecido.
    try {
      setDoServidor(await buscarTempoEstudadoHoje());
    } catch {
      // offline: segue com o valor anterior
    }

    // 3) O que ainda está na fila e é de hoje também aparece (PRD 3.6).
    setDaFila(segundosNaFilaHoje(await carregarFila(), new Date()));
  }, []);

  // Ao abrir/voltar para a aba.
  useFocusEffect(
    useCallback(() => {
      sincronizar();
    }, [sincronizar]),
  );

  // Ao voltar para o app (a internet pode ter voltado nesse meio-tempo).
  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') sincronizar();
    });
    return () => assinatura.remove();
  }, [sincronizar]);

  return { segundosSalvos: doServidor + daFila, sincronizar };
}
